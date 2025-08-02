import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { AuthService } from './auth.service';
import {
  IApiError,
  ICreateMachineResponse,
  IListMachinesResponse,
  IGetLogsResponse,
  ICurrentUser,
} from '../interfaces/api.interface';

@Injectable()
export class ApiService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  async createMachine(): Promise<ICreateMachineResponse> {
    return this.request<ICreateMachineResponse>('POST', '/machine', {});
  }

  async listMachines(): Promise<IListMachinesResponse> {
    return this.request<IListMachinesResponse>('GET', '/machines');
  }

  async deleteMachine(machineId: string): Promise<void> {
    await this.request<void>('DELETE', `/machine/${machineId}`);
  }

  async listServices(machineId?: string): Promise<any> {
    const params = new URLSearchParams();
    if (machineId) {
      params.append('machineId', machineId);
    }
    const query = params.toString();
    return this.request<any>('GET', `/services${query ? `?${query}` : ''}`);
  }

  async getServiceLogs(
    serviceId: string,
    options: { tail?: number } = {},
  ): Promise<IGetLogsResponse> {
    const params = new URLSearchParams();
    if (options.tail) {
      params.append('tail', options.tail.toString());
    }

    const queryString = params.toString();
    const path = `/service/${encodeURIComponent(serviceId)}/logs${queryString ? `?${queryString}` : ''}`;

    return this.request<IGetLogsResponse>('GET', path);
  }

  async startService(
    serviceId: string,
  ): Promise<{ message: string; serviceId: string }> {
    return this.request<{ message: string; serviceId: string }>(
      'POST',
      `/service/${encodeURIComponent(serviceId)}/start`,
    );
  }

  async stopService(
    serviceId: string,
  ): Promise<{ message: string; serviceId: string }> {
    return this.request<{ message: string; serviceId: string }>(
      'POST',
      `/service/${encodeURIComponent(serviceId)}/stop`,
    );
  }

  async restartService(
    serviceId: string,
  ): Promise<{ message: string; serviceId: string }> {
    return this.request<{ message: string; serviceId: string }>(
      'POST',
      `/service/${encodeURIComponent(serviceId)}/restart`,
    );
  }

  async renameService(
    serviceId: string,
    newName: string,
  ): Promise<{ message: string; serviceId: string; name: string }> {
    return this.request<{ message: string; serviceId: string; name: string }>(
      'PUT',
      `/service/${encodeURIComponent(serviceId)}/rename`,
      { name: newName },
    );
  }

  async deleteService(serviceId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      'DELETE',
      `/service/${encodeURIComponent(serviceId)}`,
    );
  }

  async resetAllResources(): Promise<{
    deletedServices: number;
    deletedMachines: number;
  }> {
    return this.request<{ deletedServices: number; deletedMachines: number }>(
      'DELETE',
      '/reset',
    );
  }

  async getCurrentUser(): Promise<ICurrentUser> {
    return this.request<ICurrentUser>('GET', '/me');
  }

  async setDefaultMachine(machineId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('PUT', '/machine/use', {
      machineId,
    });
  }

  async setEnvVars(
    serviceId: string,
    envVars: Record<string, string>,
  ): Promise<{ message: string; count: number }> {
    return this.request<{ message: string; count: number }>(
      'POST',
      `/service/${encodeURIComponent(serviceId)}/env`,
      envVars,
    );
  }

  async getEnvVar(
    serviceId: string,
    key: string,
  ): Promise<Record<string, string>> {
    return this.request<Record<string, string>>(
      'GET',
      `/service/${encodeURIComponent(serviceId)}/env/${encodeURIComponent(key)}`,
    );
  }

  async listEnvVars(serviceId: string): Promise<Record<string, string>> {
    return this.request<Record<string, string>>(
      'GET',
      `/service/${encodeURIComponent(serviceId)}/env`,
    );
  }

  async deleteEnvVar(
    serviceId: string,
    key: string,
  ): Promise<{ message: string }> {
    return this.request<{ message: string }>(
      'DELETE',
      `/service/${encodeURIComponent(serviceId)}/env/${encodeURIComponent(key)}`,
    );
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    data?: any,
    retry = true,
  ): Promise<T> {
    try {
      const apiUrl = this.configService.getApiUrl();
      const url = `${apiUrl}${path}`;
      const headers = await this.getHeaders();
      const config = { headers };

      let response: any;
      switch (method) {
        case 'GET':
          response = await firstValueFrom(this.httpService.get<T>(url, config));
          break;
        case 'POST':
          response = await firstValueFrom(
            this.httpService.post<T>(url, data, config),
          );
          break;
        case 'PUT':
          response = await firstValueFrom(
            this.httpService.put<T>(url, data, config),
          );
          break;
        case 'DELETE':
          response = await firstValueFrom(
            this.httpService.delete<T>(url, config),
          );
          break;
      }
      return response.data;
    } catch (error: any) {
      // If unauthorized and we haven't retried yet, trigger login
      if (error.response?.status === 401 && retry) {
        await this.handleUnauthorized();
        // Retry the request once after login
        return this.request<T>(method, path, data, false);
      }
      return this.handleError(error);
    }
  }

  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Get auth token
    const token = await this.authService.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async handleUnauthorized(): Promise<void> {
    console.log('\n🔐 Authentication required. Please log in to continue.\n');

    // Delete any existing invalid token
    await this.authService.deleteToken();

    // Run the OAuth flow
    await this.authService.performOAuthFlow();
  }

  private async handleError(error: any): Promise<never> {
    if (error.response) {
      const errorData: IApiError = {
        message: error.response.data?.message || 'Unknown error',
        statusCode: error.response.status,
        error: error.response.data?.error,
      };

      switch (error.response.status) {
        case 400:
          throw new Error(`Bad Request: ${errorData.message}`);
        case 401:
          throw new Error(
            'Authentication failed. Please run "superjolt login" first.',
          );
        case 403:
          throw new Error(
            'Forbidden: You do not have permission to perform this action',
          );
        case 404:
          throw new Error(`Not Found: ${errorData.message}`);
        case 503:
          throw new Error(
            'Service Unavailable: The API service is temporarily unavailable',
          );
        default:
          throw new Error(
            `API Error (${errorData.statusCode}): ${errorData.message}`,
          );
      }
    } else if (error.request) {
      throw new Error(
        'Network Error: Unable to connect to the API. Please check your connection and API URL.',
      );
    } else {
      throw new Error(`Error: ${error.message}`);
    }
  }
}
