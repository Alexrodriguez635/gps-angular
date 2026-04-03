import { Component, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-defaulticon-compatibility';

// Referencia para producción
const Routing = (L as any).Routing;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  distancia = signal<string>('0 km');
  tiempo = signal<string>('0 min');

  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: L.Map;

  ngAfterViewInit() {
    this.initMap();
  }

  private initMap(): void {  

    // 1. Inicializar el mapa
    this.map = L.map(this.mapContainer.nativeElement).setView([40.4167, -3.7032], 13);

    // 2. Capa de mapa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // 3. Control de rutas
    if (Routing) {
      const routingControl = Routing.control({
  waypoints: [
    L.latLng(40.4167, -3.7032),
    L.latLng(40.4530, -3.6883)
  ],
  router: Routing.osrmv1({
  serviceUrl: 'https://project-osrm.org' // ⬅️ URL COMPLETA
}),  
  routeWhileDragging: true,
  show: true,
  addWaypoints: true
}).addTo(this.map);

      // Evento para actualizar distancia/tiempo
      routingControl.on('routesfound', (e: any) => {    
    const routes = e.routes;
    if (routes && routes.length > 0) {
      const summary = routes[0].summary;
      this.distancia.set((summary.totalDistance / 1000).toFixed(2) + ' km');
      this.tiempo.set(Math.round(summary.totalTime / 60) + ' min');
    }
  });

      // Evento de clic para cambiar destino
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        routingControl.setWaypoints([
          L.latLng(40.4167, -3.7032),
          e.latlng
        ]);
      });
    }
  }
}
