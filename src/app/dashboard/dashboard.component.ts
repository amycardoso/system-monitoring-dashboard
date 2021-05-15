import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../service/dashboard.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SystemHealth } from '../interface/system-health';
import { SystemCpu } from '../interface/system-cpu';

@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.css'] })
export class DashboardComponent implements OnInit {
  public traceList: any[] = [];
  public selectedTrace: any;
  public systemHealth: SystemHealth;
  public systemCpu: SystemCpu;
  public processUpTime: string;
  public http200Traces: any[] = [];
  public http400Traces: any[] = [];
  public http404Traces: any[] = [];
  public http500Traces: any[] = [];
  public httpDefaultTraces: any[] = [];
  private timestamp: number;
  public pageSize = 10;
  public page = 1;

  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.getTraces();
    this.getSystemHealth();
    this.getCpuUsage();
    this.getProcessUpTime(true);
  }

  public onSelectTrace(trace: any): void {
    this.selectedTrace = trace;
    document.getElementById('trace-modal')!.click();
  }

  private getTraces() {
    this.dashboardService.getHttpTraces().subscribe(
      (response: any) => {
        this.processTraces(response.traces);
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private processTraces(traces: any) {
    this.traceList = traces.filter((trace) => {
      return !this.checkIfIncludesPath(trace.request.uri);
    });
    this.traceList.forEach(trace => {
      switch (trace.response.status) {
        case 200:
          this.http200Traces.push(trace);
          break;
        case 400:
          this.http400Traces.push(trace);
          break;
        case 404:
          this.http404Traces.push(trace);
          break;
        case 500:
          this.http500Traces.push(trace);
          break;
        default:
          this.httpDefaultTraces.push(trace);
      }
    });
  }

  public checkIfIncludesPath(uri: string): boolean {
    var includesPath = false;
    for (let path of ['actuator', 'swagger-resources', 'v2']) {
      if (uri.includes(path)) {
        includesPath = true;
        break;
      }
    }
    return includesPath;
  }

  private getSystemHealth() {
    this.dashboardService.getSystemHealth().subscribe(
      (response: SystemHealth) => {
        this.systemHealth = response;
        this.systemHealth.components.diskSpace.details.free = this.formatBytes(this.systemHealth.components.diskSpace.details.free);
      },
      (error: HttpErrorResponse) => {
        this.systemHealth = error.error;
        this.systemHealth.components.diskSpace.details.free = this.formatBytes(this.systemHealth.components.diskSpace.details.free);
      }
    );
  }

  private getCpuUsage() {
    this.dashboardService.getSystemCpu().subscribe(
      (response: SystemCpu) => {
        this.systemCpu = response;
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private getProcessUpTime(isUpdateTime: boolean) {
    this.dashboardService.getProcessUptime().subscribe(
      (response: any) => {
        this.timestamp = Math.round(response.measurements[0].value);
        this.processUpTime = this.formateUptime(this.timestamp);
        if (isUpdateTime) {
          this.updateTime();
        }
      },
      (error: HttpErrorResponse) => {
        alert(error.message);
      }
    );
  }

  private formateUptime(timestamp: number): string {
    const hours = Math.floor(timestamp / 60 / 60);
    const minutes = Math.floor(timestamp / 60) - (hours * 60);
    const seconds = timestamp % 60;
    return hours.toString().padStart(2, '0') + 'h' +
      minutes.toString().padStart(2, '0') + 'm' + seconds.toString().padStart(2, '0') + 's';
  }

  private formatBytes(bytes): string {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const dm = 2 < 0 ? 0 : 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  private updateTime(): void {
    setInterval(() => {
      this.processUpTime = this.formateUptime(this.timestamp + 1);
      this.timestamp++;
    }, 1000);
  }

}
