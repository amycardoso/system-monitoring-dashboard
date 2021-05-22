import { Component, OnInit } from '@angular/core';
import { DashboardService } from '../service/dashboard.service';
import { HttpErrorResponse } from '@angular/common/http';
import { SystemHealth } from '../interface/system-health';
import { SystemCpu } from '../interface/system-cpu';
import Chart from 'chart.js/auto';

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

  public onRefreshData(): void {
    this.http200Traces = [];
    this.http400Traces = [];
    this.http404Traces = [];
    this.http500Traces = [];
    this.getTraces();
    this.getSystemHealth();
    this.getCpuUsage();
    this.getProcessUpTime(false);
  }

  public onSelectTrace(trace: any): void {
    this.selectedTrace = trace;
    document.getElementById('trace-modal')!.click();
  }

  private getTraces() {
    this.dashboardService.getHttpTraces().subscribe(
      (response: any) => {
        this.processTraces(response.traces);
        this.initializeBarChart();
        this.initializePieChart();
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
    for (let path of ['actuator', 'swagger-resources', 'swagger-ui', 'v2']) {
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

  private initializeBarChart(): Chart {
    const element = document.getElementById('barChart');
    return new Chart(element, {
      type: "bar",
      data: {
        labels: ['200', '404', '400', '500'],
        datasets: [{
          data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
          backgroundColor: ['rgb(25, 135, 84)', 'rgb(255, 193, 7)', 'rgb(13, 202, 240)', 'rgb(220, 53, 69)'],
          borderColor: ['rgb(25, 135, 84)', 'rgb(255, 193, 7)', 'rgb(13, 202, 240)', 'rgb(220, 53, 69)'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: false
          },
          scales: {
            yAxes: [{
              ticks: {
                beginAtZero: true
              }
            }]
          }
        }
      }

    });
  }

  private initializePieChart(): Chart {
    const element = document.getElementById('pieChart');
    return new Chart(element, {
      type: "pie",
      data: {
        labels: ['200', '404', '400', '500'],
        datasets: [{
          data: [this.http200Traces.length, this.http404Traces.length, this.http400Traces.length, this.http500Traces.length],
          backgroundColor: ['rgb(25, 135, 84)', 'rgb(255, 193, 7)', 'rgb(13, 202, 240)', 'rgb(220, 53, 69)'],
          borderColor: ['rgb(25, 135, 84)', 'rgb(255, 193, 7)', 'rgb(13, 202, 240)', 'rgb(220, 53, 69)'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
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

  public exportTableToExcel(): void {
    const downloadLink = document.createElement('a');
    const dataType = 'application/vnd.ms-excel';
    const table = document.getElementById('httptrace-table');
    const tableHTML = table!.outerHTML.replace(/ /g, '%20');
    const filename = 'httptrace.xls';
    document.body.appendChild(downloadLink);
    downloadLink.href = 'data:' + dataType + ', ' + tableHTML;
    downloadLink.download = filename;
    downloadLink.click();
  }
}
