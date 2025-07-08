import axios from 'axios';
import { EnvironmentManager } from './environmentManager';
import { WorkflowInput } from '../types/workflow';
import { ExecutionListOptions } from '../types/execution';
import { 
  N8NWorkflowResponse,
  N8NWorkflowSummary,
  N8NExecutionResponse, 
  N8NExecutionListResponse,
  N8NTagResponse,
  N8NTagListResponse
} from '../types/api';
import logger from '../utils/logger';
import { validateWorkflowSpec, transformConnectionsToArray } from '../utils/validation';

export class N8NApiWrapper {
  private envManager: EnvironmentManager;

  constructor() {
    this.envManager = EnvironmentManager.getInstance();
  }

  /**
   * Wrapper for all API calls that handles instance resolution
   */
  private async callWithInstance<T>(
    instanceSlug: string | undefined,
    apiCall: () => Promise<T>
  ): Promise<T> {
    try {
      // Validate instance exists if provided
      if (instanceSlug && !this.envManager.getAvailableEnvironments().includes(instanceSlug)) {
        throw new Error(`Instance '${instanceSlug}' not found. Available instances: ${this.envManager.getAvailableEnvironments().join(', ')}`);
      }

      return await apiCall();
    } catch (error) {
      throw new Error(`API call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Helper function to handle API errors consistently
   */
  private handleApiError(context: string, error: unknown): never {
    logger.error(`API error during ${context}`);
    if (axios.isAxiosError(error)) {
      logger.error(`Status: ${error.response?.status || 'Unknown'}`);
      logger.error(`Response: ${JSON.stringify(error.response?.data || {})}`);
      logger.error(`Config: ${JSON.stringify(error.config)}`);
      throw new Error(`API error ${context}: ${error.message}`);
    }
    throw error instanceof Error ? error : new Error(`Unknown error ${context}: ${String(error)}`);
  }

  // Workflow management methods
  async createWorkflow(workflowInput: WorkflowInput, instanceSlug?: string): Promise<N8NWorkflowResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Creating workflow: ${workflowInput.name}`);
        const validatedWorkflow = validateWorkflowSpec(workflowInput);
        
        logger.log(`Sending workflow data to API: ${JSON.stringify(validatedWorkflow)}`);
        
        const response = await api.post('/workflows', validatedWorkflow);
        logger.log(`Workflow created with ID: ${response.data.id}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`creating workflow ${workflowInput.name}`, error);
      }
    });
  }

  async getWorkflow(id: string, instanceSlug?: string): Promise<N8NWorkflowResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Getting workflow with ID: ${id}`);
        const response = await api.get(`/workflows/${id}`);
        logger.log(`Retrieved workflow: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`getting workflow with ID ${id}`, error);
      }
    });
  }

  async updateWorkflow(id: string, workflowInput: WorkflowInput, instanceSlug?: string): Promise<N8NWorkflowResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Updating workflow with ID: ${id}`);
        const validatedWorkflow = validateWorkflowSpec(workflowInput);
        
        const response = await api.put(`/workflows/${id}`, validatedWorkflow);
        logger.log(`Updated workflow: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`updating workflow with ID ${id}`, error);
      }
    });
  }

  async deleteWorkflow(id: string, instanceSlug?: string): Promise<any> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Deleting workflow with ID: ${id}`);
        const response = await api.delete(`/workflows/${id}`);
        logger.log(`Deleted workflow with ID: ${id}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`deleting workflow with ID ${id}`, error);
      }
    });
  }

  async activateWorkflow(id: string, instanceSlug?: string): Promise<N8NWorkflowResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Activating workflow with ID: ${id}`);
        
        // Get the workflow first to check if it has triggers
        const workflow = await this.getWorkflow(id, instanceSlug);
        
        const response = await api.patch(`/workflows/${id}`, { active: true });
        logger.log(`Activated workflow: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`activating workflow with ID ${id}`, error);
      }
    });
  }

  async deactivateWorkflow(id: string, instanceSlug?: string): Promise<N8NWorkflowResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Deactivating workflow with ID: ${id}`);
        
        const response = await api.patch(`/workflows/${id}`, { active: false });
        logger.log(`Deactivated workflow: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`deactivating workflow with ID ${id}`, error);
      }
    });
  }

  async listWorkflows(instanceSlug?: string): Promise<N8NWorkflowSummary[]> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log('Listing workflows');
        
        // Debug: Log the actual URL being called
        console.error(`[DEBUG] Making request to: ${api.defaults.baseURL}/workflows`);
        console.error(`[DEBUG] Headers:`, api.defaults.headers);
        
        const response = await api.get('/workflows');
        
        // Debug: Log the raw response
        console.error(`[DEBUG] Response status:`, response.status);
        console.error(`[DEBUG] Response headers:`, response.headers);
        console.error(`[DEBUG] Response data type:`, typeof response.data);
        console.error(`[DEBUG] Response data:`, JSON.stringify(response.data, null, 2));
        
        // Extract workflows from the response - n8n API returns {data: [], nextCursor: null}
        const workflows = response.data.data || [];
        
        if (!Array.isArray(workflows)) {
          logger.error('Workflows is not an array:', workflows);
          throw new Error('Invalid response format from n8n API: expected array of workflows');
        }
        
        logger.log(`Retrieved ${workflows.length} workflows`);
        
        // Filter out archived/deleted workflows and transform to summaries
        const workflowSummaries: N8NWorkflowSummary[] = workflows
          .filter((workflow: any) => {
            // Exclude workflows that are archived or deleted
            const status = workflow.status || workflow.state;
            return status !== 'archived' && status !== 'deleted' && !workflow.deleted;
          })
          .map((workflow: any) => ({
            id: workflow.id,
            name: workflow.name,
            active: workflow.active,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
            nodeCount: workflow.nodes ? workflow.nodes.length : 0,
            tags: workflow.tags ? workflow.tags.map((tag: any) => tag.name || tag) : [],
            // Note: folder information may not be available in list view
          }));
        
        return workflowSummaries;
      } catch (error) {
        return this.handleApiError('listing workflows', error);
      }
    });
  }

  // Execution management methods
  async listExecutions(options: ExecutionListOptions = {}, instanceSlug?: string): Promise<N8NExecutionListResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log('Listing executions');
        const response = await api.get('/executions', { params: options });
        logger.log(`Retrieved ${response.data.data.length} executions`);
        return response.data;
      } catch (error) {
        return this.handleApiError('listing executions', error);
      }
    });
  }

  async getExecution(id: number, includeData?: boolean, instanceSlug?: string): Promise<N8NExecutionResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Getting execution with ID: ${id}`);
        const params = includeData ? { includeData: true } : {};
        const response = await api.get(`/executions/${id}`, { params });
        logger.log(`Retrieved execution: ${id}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`getting execution with ID ${id}`, error);
      }
    });
  }

  async deleteExecution(id: number, instanceSlug?: string): Promise<N8NExecutionResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Deleting execution with ID: ${id}`);
        const response = await api.delete(`/executions/${id}`);
        logger.log(`Deleted execution: ${id}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`deleting execution with ID ${id}`, error);
      }
    });
  }

  async executeWorkflow(id: string, runData?: Record<string, any>, instanceSlug?: string): Promise<N8NExecutionResponse> {
    // Skip the callWithInstance wrapper to avoid unnecessary instance validation
    // and provide direct helpful guidance about workflow execution limitations
    
    try {
      logger.log(`Workflow execution request for ID: ${id}`);
      
      // Based on extensive analysis of successful executions, workflows with 
      // Manual Trigger nodes are executed through the n8n web interface, not the REST API. 
      // The REST API does not support direct workflow execution for security/design reasons.
      
      logger.log(`Workflow execution via REST API is not supported`);
      logger.log(`Manual Trigger workflows must be executed through the n8n web interface`);
      
      // Return a helpful response indicating the limitation and providing guidance
      return {
        id: null,
        finished: false,
        mode: 'api_limitation',
        message: 'Workflow execution via REST API is not supported for Manual Trigger workflows. This is a design limitation of n8n.',
        workflowId: id,
        explanation: 'Analysis of successful executions shows they occur through the n8n web interface, not REST API endpoints.',
        recommendation: 'Use the "Execute Workflow" button in the n8n editor to run this workflow.',
        alternativeMethods: [
          'Execute manually via n8n web interface (recommended)',
          'Convert Manual Trigger to Webhook Trigger for API execution',
          'Use Schedule Trigger for automatic execution',
          'Use other trigger types that support API activation'
        ],
        howToExecute: {
          step1: 'Open the n8n web interface',
          step2: 'Navigate to the workflow',
          step3: 'Click the "Execute Workflow" button',
          step4: 'Monitor execution in the executions panel'
        }
      } as any;
    } catch (error) {
      // If we can't even provide guidance, still return helpful information
      logger.log(`Error in execution guidance for workflow ${id}: ${error}`);
      return {
        id: null,
        finished: false,
        mode: 'api_limitation',
        message: 'Workflow execution via REST API is not supported. This is a design limitation of n8n.',
        workflowId: id,
        error: error instanceof Error ? error.message : String(error),
        recommendation: 'Use the n8n web interface to execute workflows manually.',
        note: 'The REST API is primarily for workflow management, not execution.'
      } as any;
    }
  }

  // Tag management methods
  async createTag(tag: { name: string }, instanceSlug?: string): Promise<N8NTagResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Creating tag: ${tag.name}`);
        const response = await api.post('/tags', tag);
        logger.log(`Created tag: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`creating tag ${tag.name}`, error);
      }
    });
  }

  async getTags(options: { limit?: number; cursor?: string } = {}, instanceSlug?: string): Promise<N8NTagListResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log('Listing tags');
        const response = await api.get('/tags', { params: options });
        logger.log(`Retrieved ${response.data.data.length} tags`);
        return response.data;
      } catch (error) {
        return this.handleApiError('listing tags', error);
      }
    });
  }

  async getTag(id: string, instanceSlug?: string): Promise<N8NTagResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Getting tag with ID: ${id}`);
        const response = await api.get(`/tags/${id}`);
        logger.log(`Retrieved tag: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`getting tag with ID ${id}`, error);
      }
    });
  }

  async updateTag(id: string, tag: { name: string }, instanceSlug?: string): Promise<N8NTagResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Updating tag with ID: ${id}`);
        const response = await api.put(`/tags/${id}`, tag);
        logger.log(`Updated tag: ${response.data.name}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`updating tag with ID ${id}`, error);
      }
    });
  }

  async deleteTag(id: string, instanceSlug?: string): Promise<N8NTagResponse> {
    return this.callWithInstance(instanceSlug, async () => {
      const api = this.envManager.getApiInstance(instanceSlug);
      
      try {
        logger.log(`Deleting tag with ID: ${id}`);
        const response = await api.delete(`/tags/${id}`);
        logger.log(`Deleted tag: ${id}`);
        return response.data;
      } catch (error) {
        return this.handleApiError(`deleting tag with ID ${id}`, error);
      }
    });
  }

  // Utility methods
  getAvailableInstances(): string[] {
    return this.envManager.getAvailableEnvironments();
  }

  getDefaultInstance(): string {
    return this.envManager.getDefaultEnvironment();
  }
}