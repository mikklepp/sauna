/**
 * Worker Manager
 *
 * Manages Web Workers for Island Device scheduled jobs
 * - Club Sauna Generator (runs at midnight)
 * - Club Sauna Evaluator (runs at 20:00)
 */

type WorkerType = 'club-sauna-generator' | 'club-sauna-evaluator'

interface WorkerStatus {
  type: WorkerType
  worker: Worker | null
  isRunning: boolean
  lastRun?: Date
  lastResult?: any
  error?: string
}

class WorkerManager {
  private workers: Map<WorkerType, WorkerStatus> = new Map()
  private isInitialized = false

  /**
   * Initialize all workers for the Island Device
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      // eslint-disable-next-line no-console
      console.log('[Worker Manager] Already initialized')
      return
    }

    if (typeof window === 'undefined') {
      // eslint-disable-next-line no-console
      console.log('[Worker Manager] Not in browser environment')
      return
    }

    // eslint-disable-next-line no-console
    console.log('[Worker Manager] Initializing workers...')

    try {
      // Initialize Club Sauna Generator
      this.initializeWorker('club-sauna-generator')

      // Initialize Club Sauna Evaluator
      this.initializeWorker('club-sauna-evaluator')

      this.isInitialized = true
      // eslint-disable-next-line no-console
      console.log('[Worker Manager] All workers initialized')
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Worker Manager] Initialization failed:', err)
      throw err
    }
  }

  /**
   * Initialize a specific worker
   */
  private initializeWorker(type: WorkerType): void {
    try {
      const workerPath = `/workers/${type}.ts`
      const worker = new Worker(new URL(workerPath, import.meta.url))

      const status: WorkerStatus = {
        type,
        worker,
        isRunning: false,
      }

      // Listen for messages from the worker
      worker.addEventListener('message', (event) => {
        const { type: messageType, result } = event.data

        if (messageType === 'COMPLETE') {
          // eslint-disable-next-line no-console
          console.log(`[Worker Manager] ${type} completed:`, result)
          status.lastRun = new Date()
          status.lastResult = result
          status.isRunning = false
          status.error = undefined
        }
      })

      // Listen for errors
      worker.addEventListener('error', (event) => {
        // eslint-disable-next-line no-console
        console.error(`[Worker Manager] ${type} error:`, event.message)
        status.error = event.message
        status.isRunning = false
      })

      this.workers.set(type, status)

      // Start the worker's schedule
      worker.postMessage({ type: 'SCHEDULE' })

      // eslint-disable-next-line no-console
      console.log(`[Worker Manager] ${type} initialized and scheduled`)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[Worker Manager] Failed to initialize ${type}:`, err)
      throw err
    }
  }

  /**
   * Manually trigger a worker to run now
   */
  async runWorker(type: WorkerType): Promise<any> {
    const status = this.workers.get(type)

    if (!status || !status.worker) {
      throw new Error(`Worker ${type} is not initialized`)
    }

    if (status.isRunning) {
      throw new Error(`Worker ${type} is already running`)
    }

    // eslint-disable-next-line no-console
    console.log(`[Worker Manager] Manually triggering ${type}`)
    status.isRunning = true

    return new Promise((resolve, reject) => {
      const worker = status.worker!

      // Set up one-time listener for this manual run
      const handleMessage = (event: MessageEvent) => {
        const { type: messageType, result } = event.data

        if (messageType === 'COMPLETE') {
          worker.removeEventListener('message', handleMessage)
          status.lastRun = new Date()
          status.lastResult = result
          status.isRunning = false
          status.error = undefined
          resolve(result)
        }
      }

      const handleError = (event: ErrorEvent) => {
        worker.removeEventListener('error', handleError)
        status.error = event.message
        status.isRunning = false
        reject(new Error(event.message))
      }

      worker.addEventListener('message', handleMessage)
      worker.addEventListener('error', handleError)

      // Trigger the worker
      worker.postMessage({ type: 'RUN_NOW' })

      // Timeout after 2 minutes
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage)
        worker.removeEventListener('error', handleError)
        status.isRunning = false
        reject(new Error('Worker timeout'))
      }, 120000)
    })
  }

  /**
   * Get status of all workers
   */
  getStatus(): Record<WorkerType, Omit<WorkerStatus, 'worker'>> {
    const status: any = {}

    this.workers.forEach((workerStatus, type) => {
      status[type] = {
        type: workerStatus.type,
        isRunning: workerStatus.isRunning,
        lastRun: workerStatus.lastRun,
        lastResult: workerStatus.lastResult,
        error: workerStatus.error,
      }
    })

    return status
  }

  /**
   * Get status of a specific worker
   */
  getWorkerStatus(type: WorkerType): Omit<WorkerStatus, 'worker'> | null {
    const status = this.workers.get(type)
    if (!status) return null

    return {
      type: status.type,
      isRunning: status.isRunning,
      lastRun: status.lastRun,
      lastResult: status.lastResult,
      error: status.error,
    }
  }

  /**
   * Terminate all workers
   */
  terminateAll(): void {
    // eslint-disable-next-line no-console
    console.log('[Worker Manager] Terminating all workers')

    this.workers.forEach((status, type) => {
      if (status.worker) {
        status.worker.terminate()
        // eslint-disable-next-line no-console
        console.log(`[Worker Manager] Terminated ${type}`)
      }
    })

    this.workers.clear()
    this.isInitialized = false
  }

  /**
   * Terminate a specific worker
   */
  terminateWorker(type: WorkerType): void {
    const status = this.workers.get(type)

    if (status && status.worker) {
      status.worker.terminate()
      this.workers.delete(type)
      // eslint-disable-next-line no-console
      console.log(`[Worker Manager] Terminated ${type}`)
    }
  }

  /**
   * Check if workers are initialized
   */
  isReady(): boolean {
    return this.isInitialized
  }
}

// Singleton instance
export const workerManager = new WorkerManager()

/**
 * Initialize workers (call this when Island Device is configured)
 */
export async function initializeWorkers(): Promise<void> {
  return workerManager.initialize()
}

/**
 * Run a worker manually (for testing or manual triggers)
 */
export async function runWorkerNow(type: WorkerType): Promise<any> {
  return workerManager.runWorker(type)
}

/**
 * Get status of all workers
 */
export function getWorkerStatus(): ReturnType<typeof workerManager.getStatus> {
  return workerManager.getStatus()
}

/**
 * Terminate all workers (call on device reset)
 */
export function terminateWorkers(): void {
  workerManager.terminateAll()
}
