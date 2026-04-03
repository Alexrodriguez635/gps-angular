import { Component, AfterViewInit, ElementRef, ViewChild, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-defaulticon-compatibility';

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

    // 2. Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // 3. Configurar OSRM con Leaflet Routing Machine
    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(40.4167, -3.7032), // Madrid (Origen)
        L.latLng(40.4530, -3.6883)  // Santiago Bernabéu (Destino)
      ],            
      routeWhileDragging: true,
      show: true,
      addWaypoints: true
    }).addTo(this.map);

    routingControl.on('routesfound', (e: any) => {
      const routes = e.routes;
      const summary = routes[0].summary;
    
      // Convertir metros a km y segundos a minutos
      this.distancia.set((summary.totalDistance / 1000).toFixed(2) + ' km');
      this.tiempo.set(Math.round(summary.totalTime / 60) + ' min');
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
    routingControl.setWaypoints([
      L.latLng(40.4167, -3.7032), // Mantenemos el origen fijo
      e.latlng                    // El destino será donde hagas clic
    ]);
    });
  }

  


}
