export interface IApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface ICreateMachineResponse {
  id: string;
  name: string;
}

export interface IMachineListItem {
  id: string;
  name: string;
  status?: string;
  createdAt: string;
  cpuUsage?: number;
  memoryUsage?: number;
  memoryTotal?: number;
  diskUsage?: number;
  diskTotal?: number;
  cpuCores?: number;
}

export interface IListMachinesResponse {
  machines: IMachineListItem[];
  total: number;
}

export interface IServiceListItem {
  id: string;
  name: string;
  status: string;
  state: string;
  createdAt: string;
}

export interface IListServicesResponse {
  services: IServiceListItem[];
  total: number;
}

export interface ILogsMetadata {
  lines: number;
  truncated: boolean;
  from?: string;
  to?: string;
}

export interface IGetLogsResponse {
  serviceId: string;
  logs: string;
  metadata: ILogsMetadata;
}

export interface ITenant {
  id: string;
  name: string;
  maxMachines: number;
  machineCount: number;
}

export interface ICurrentUser {
  id: string;
  email: string;
  name: string;
  githubUsername: string;
  avatarUrl: string;
  tenantId: string;
  lastUsedMachineId: string | null;
  tenant: ITenant;
}
