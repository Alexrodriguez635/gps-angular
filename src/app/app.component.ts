import { Component, ElementRef, ViewChild, signal, afterNextRender, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private platformId = inject(PLATFORM_ID);
  
  distancia = signal<string>('0 km');
  tiempo = signal<string>('0 min');
  cargando = signal<boolean>(false);  

  // Asegúrate que en el HTML sea #mapContainer (C mayúscula)
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  private map!: any;

  constructor() {
    // UNICA ejecución: afterNextRender es lo mejor para SSR + Leaflet
    afterNextRender(() => {
      this.initMap();
    });
  }

  private async initMap(): Promise<void> {
    // 1. Importación base
    const Leaflet = await import('leaflet');
    await import('leaflet-control-geocoder');
    // Forzamos la carga de los plugins
    await import('leaflet-routing-machine');
    await import('leaflet-defaulticon-compatibility');
    // @ts-ignore: missing type declarations for module
    await import('lrm-graphhopper');  

    // TRUCO: Leaflet en versiones modernas a veces requiere acceder a .default
    const L = (Leaflet as any).default || Leaflet;

    if (!this.mapContainer) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = L.map(this.mapContainer.nativeElement).setView([40.4167, -3.7032], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);    

    // 2. Usar la referencia global de Leaflet para el Routing
    // En el navegador, los plugins se registran en window.L
    const LeafletGlobal = (window as any).L;

    const routingControl = (L as any).Routing.control({
      
  waypoints: [
    L.latLng(40.4167, -3.7032),
    L.latLng(40.4530, -3.6883)
  ],
  // CAMBIO A GRAPHOPPER: Más rápido y confiable para producción
  router: (L as any).Routing.graphHopper('d41add17-f1a0-4899-982f-a88c26abbde2', {
    urlParameters: {
      vehicle: 'car',
      locale: 'es',
    }
  }),
  routeWhileDragging: true,
  show: true,
  lineOptions: { styles: [{ color: '#2c3e50', opacity: 0.8, weight: 6 }] }
}).addTo(this.map);

const geocoder = (L as any).Control.geocoder({
    defaultMarkGeocode: false, // Evitamos que ponga un marcador por defecto
    placeholder: 'Buscar dirección...',
    errorMessage: 'No se encontró la ubicación'
  })
  .on('markgeocode', (e: any) => {
    const latlng = e.geocode.center;
    
    // Centrar el mapa en la búsqueda
    this.map.setView(latlng, 16);

    // OPCIONAL: Actualizar el destino de la ruta automáticamente al buscar
    routingControl.setWaypoints([
      L.latLng(40.4167, -3.7032), 
      latlng                      
    ]);
  })
  .addTo(this.map);

    routingControl.on('routingstart', () => this.cargando.set(true));
routingControl.on('routesfound', (e: any) => {
  this.cargando.set(false);
  const route = e.routes[0]; 
  if (route && route.summary) {
    this.distancia.set((route.summary.totalDistance / 1000).toFixed(2) + ' km');
    this.tiempo.set(Math.round(route.summary.totalTime / 60) + ' min');
  }
});

    routingControl.on('routingstart', () => this.cargando.set(true));
    routingControl.on('routesfound', () => this.cargando.set(false));
    routingControl.on('routingerror', () => this.cargando.set(false));


    this.map.on('click', (e: any) => {
      routingControl.setWaypoints([
        L.latLng(40.4167, -3.7032), 
        e.latlng                    
      ]);
    });
  }
}
