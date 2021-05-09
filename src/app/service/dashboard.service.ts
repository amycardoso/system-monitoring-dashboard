import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SystemHealth } from '../interface/system-health';
import { SystemCpu } from '../interface/system-cpu';
import { environment } from 'src/environments/environment';

@Injectable({providedIn: 'root'})
export class DashboardService {
  private SERVER_URL = environment.serverUrl;

  constructor(private http: HttpClient) {}

  public getHttpTraces(): Observable<any> {
    return this.http.get<any>(`${this.SERVER_URL}/httptrace`);
  }

  public getSystemHealth(): Observable<SystemHealth> {
    return this.http.get<SystemHealth>(`${this.SERVER_URL}/health`);
  }

  public getSystemCpu(): Observable<SystemCpu> {
    return this.http.get<SystemCpu>(`${this.SERVER_URL}/metrics/system.cpu.count`);
  }

  public getProcessUptime(): Observable<any> {
    return this.http.get<any>(`${this.SERVER_URL}/metrics/process.uptime`);
  }

}
