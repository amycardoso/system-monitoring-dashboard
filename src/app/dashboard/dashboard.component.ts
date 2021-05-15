import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../service/dashboard.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({ selector: 'app-dashboard', templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.css'] })
export class DashboardComponent implements OnInit {
  public traceList: any[] = [];
  public selectedTrace: any;
  public http200Traces: any[] = [];
  public http400Traces: any[] = [];
  public http404Traces: any[] = [];
  public http500Traces: any[] = [];
  public httpDefaultTraces: any[] = [];
  public pageSize = 10;
  public page = 1;


  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.getTraces();
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
      return !trace.request.uri.includes('actuator');
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

}
