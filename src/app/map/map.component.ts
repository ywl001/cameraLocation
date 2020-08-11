import { Component, OnInit, ComponentFactory, ComponentFactoryResolver, ViewChild, ViewContainerRef, Injector, ComponentRef, ApplicationRef } from '@angular/core';
import { SqlService } from '../services/sql.service';
import { Camera } from '../models/camera';
import { Model } from '../models/model';
import { MarkerInfoComponent } from '../marker-info/marker-info.component';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import * as toastr from 'toastr';
import { EditMarkComponent } from '../edit-mark/edit-mark.component';
import { MatDialog } from '@angular/material';
import { CAMERA_TYPES } from '../models/cameraTypes';

declare var BMap;
declare var BMAP_SATELLITE_MAP;
declare var BMAP_NORMAL_MAP;
declare var BMAP_ANIMATION_DROP;
declare var BMAP_ANIMATION_BOUNCE;

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  //百度地图
  private bdmap;
  private cameraLib: Map<number, Camera>;
  private focusIndex = 1000000;

  private prevMarker;
  private nowMarker;
  private infoWindow;

  private isMoveMark: boolean;
  private pressTimer;
  private isDrag: boolean;

  private focusMarkID;

  private compRef: ComponentRef<MarkerInfoComponent>;

  constructor(
    private sqlService: SqlService,
    private resolver: ComponentFactoryResolver,
    public dialog: MatDialog,
    private injector: Injector) {
    EventBus.addEventListener(EventType.MARKER_IMAGE_LOADED, e => { this.refreshInfoWindow() });
    EventBus.addEventListener(EventType.MOVE_MARKER, e => { this.isMoveMark = true });
    EventBus.addEventListener(EventType.HIDE_INFO_WINDOW, e => { this.hideInfoWindow() });
    EventBus.addEventListener(EventType.SET_CURSOR, e => { this.bdmap.setDefaultCursor(e.target) });
    EventBus.addEventListener(EventType.MAP_LAYER_CHANGE, e => { this.mapLayerChange(e.target) })
    EventBus.addEventListener(EventType.SHOW_SEARCH_MARK, e => { this.showSearchMark(e.target) })
    EventBus.addEventListener(EventType.REFRESH_MARK, e => { this.refreshMarks(true) })
  }

  ngOnInit() {
    this.initMap();
    this.cameraLib = new Map();
  }

  // 初始化地图
  private initMap() {
    this.bdmap = new BMap.Map("map", { enableMapClick: false });//禁止地图图标点击
    this.bdmap.centerAndZoom('洛阳', 11);
    this.bdmap.enableScrollWheelZoom(true);
    this.bdmap.disableDoubleClickZoom(false);
    // this.getLocation();

    this.bdmap.addEventListener('tilesloaded', e => { this.refreshMarks(false) })
    this.bdmap.addEventListener('click', e => { this.onMapClick(e) })
    this.bdmap.addEventListener('mousedown', e => { this.onMapMouseDown(e) })
    this.bdmap.addEventListener('dragstart', e => { this.onMapDragStart(e) })
    this.bdmap.addEventListener('dragend', e => { this.onMapDragEnd(e) })
    this.bdmap.addEventListener('mouseup', e => { this.onMapMouseUp(e) })
  }

  //定位
  private getLocation() {
    var myCity = new BMap.LocalCity();
    myCity.get(res => {
      var cityName = res.name;
      this.bdmap.centerAndZoom(cityName, 11);
    });
  }

  private refreshMarks(isRefreshAll) {
    console.log('refresh')
    const bounds = this.bdmap.getBounds();
    const p1 = bounds.getSouthWest();//西南
    const p2 = bounds.getNorthEast();//东北
    const xmin = p1.lat;
    const ymin = p1.lng;
    const xmax = p2.lat;
    const ymax = p2.lng;
    const mapLevel = this.bdmap.getZoom();

    this.sqlService.getMonitorsByExtent(xmin, ymin, xmax, ymax, mapLevel)
      .subscribe(res => {
        if (isRefreshAll) {
          console.log('refresh all')
          this.cameraLib.clear();
          this.bdmap.clearOverlays();
          this.focusMarkID = undefined;
        }
        for (let i = 0; i < res.length; i++) {
          let c = Camera.toCamera(res[i]);
          //如果mark不存在，则创建添加
          if (isRefreshAll) {
            const m = this.createMark(c, false);
            this.bdmap.addOverlay(m);
            // m.setAnimation(BMAP_ANIMATION_BOUNCE)
            this.cameraLib.set(c.id, m);
          } else {
            if (!this.isCameraExists(c)) {
              const m = this.createMark(c, false);
              this.bdmap.addOverlay(m);
              // m.setAnimation(BMAP_ANIMATION_BOUNCE)
              this.cameraLib.set(c.id, m);
              let focusMark = this.cameraLib.get(this.focusMarkID)
              if (focusMark)
                this.setFocusMarker(focusMark)
            }
          }
        }
        this.clearOutExtentCamera();
      })
  }

  private isCameraExists(c: Camera) {
    if (this.cameraLib.has(c.id))
      return true;
    return false;
  }

  //清除范围外的mark
  private clearOutExtentCamera() {
    const overlays = this.bdmap.getOverlays();
    console.log('overlayer num:' + overlays.length)
    if (overlays.length > 0) {
      const currentBounds = this.bdmap.getBounds();
      const currentZoom = this.bdmap.getZoom();
      for (let i = overlays.length - 1; i >= 0; i--) {
        const m = overlays[i];
        if (!m || !m.attributes) {
          return;
        }
        if (!currentBounds.containsPoint(m.getPosition()) || m.attributes.displayLevel > currentZoom) {
          this.bdmap.removeOverlay(m);
          this.cameraLib.delete(m.attributes.id);
        }
      }
    }
  }

  //创建marker
  private createMark(c: Camera, isFocus: boolean) {
    let marker;
    let point = new BMap.Point(c.y, c.x);
    // console.log(point);
    marker = new BMap.Marker(point);
    this.focusIndex++
    //创建icon
    let icon = this.createIcon(c, isFocus);
    marker.setShadow(icon);//去除阴影
    marker.setIcon(icon);
    marker.setRotation(c.angle);

    //把station附加给marker
    marker.attributes = c;
    marker.addEventListener('click', $event => { this.markClickListener($event) });
    return marker;
  }

  private createIcon(c: Camera, isFocus: boolean) {
    let url = "assets/normal.png";
    const type = this.getType(c);
    console.log('type:', type)
    if (isFocus) {
      url = `assets/${type}_press.png`;
    } else if (!c.isRunning) {
      url = `assets/${type}_error.png`;
    } else {
      url = `assets/${type}.png`;
    }
    let icon = new BMap.Icon(
      url,
      new BMap.Size(24, 24),
      {
        anchor: new BMap.Size(12, 12)
      }
    )
    return icon;
  }

  private getType(c: Camera) {
    if (c.type) {
      for (let i = 0; i < CAMERA_TYPES.length; i++) {
        const element = CAMERA_TYPES[i];
        if (element.name == c.type) {
          return element.src
        }
      }
    }
    return "normal";
  }

  //设置焦点marker
  private setFocusMarker(marker) {
    const camera = marker.attributes
    marker.setZIndex(this.focusIndex);
    marker.setIcon(this.createIcon(camera, true));
    marker.setRotation(camera.angle);
    this.focusIndex++;
  }

  //设置失去焦点marker
  private clearFocusMarker(marker) {
    let c = marker.attributes
    marker.setIcon(this.createIcon(c, false));
    marker.setRotation(c.angle);
  }

  private hideInfoWindow() {
    this.bdmap.closeInfoWindow();
  }

  //mark的点击事件
  private markClickListener(e) {
    console.log(e);
    if (this.prevMarker) {
      this.clearFocusMarker(this.prevMarker);
    }
    this.nowMarker = e.target;
    this.setFocusMarker(this.nowMarker);
    this.prevMarker = this.nowMarker;

    const p = this.nowMarker.getPosition();

    if (this.compRef) this.compRef.destroy();

    const factory: ComponentFactory<MarkerInfoComponent> = this.resolver.resolveComponentFactory(MarkerInfoComponent);
    this.compRef = factory.create(this.injector);
    this.compRef.instance.camera = this.nowMarker.attributes;
    let div = document.createElement('div');
    div.appendChild(this.compRef.location.nativeElement);

    this.infoWindow = new BMap.InfoWindow(div);

    // infoWindow.setContent();
    this.bdmap.openInfoWindow(this.infoWindow, p);

  }

  ngDoCheck(): void {
    if (this.compRef) {
      this.compRef.changeDetectorRef.detectChanges()
    }
  }

  private refreshInfoWindow() {
    this.infoWindow.redraw();
  }

  private onMapMouseDown(e: any) {
    this.pressTimer = setTimeout(() => {
      //拖到的时候不能添加
      if (this.isDrag) return;
      //没有登录的时候不能添加
      if (!Model.USER_ID) return;

      console.log('long press')
      if (this.bdmap.getZoom() < 18) {
        this.zoomMapToMax(e.point);
      } else {
        this.showAddMarkDialog(e.point)
      }
    }, 1500);
  }

  private zoomMapToMax(center) {
    this.bdmap.centerAndZoom(center, 19)
  }

  private onMapDragStart(e) {
    console.log('drag')
    this.isDrag = true;
  }

  private onMapDragEnd(e) {
    console.log('drag stop')
    this.isDrag = false;
  }

  private onMapMouseUp(e) {
    clearTimeout(this.pressTimer)
  }

  onMapClick(e) {
    //移动mark到新位置
    if (this.isMoveMark) {
      console.log('map click')
      this.isMoveMark = false;
      EventBus.dispatch(EventType.SET_CURSOR, EventType.CURSOR_AUTO)
      toastr.clear();
      toastr.options.timeOut = 3000;
      const p = e.point;
      let data = { x: p.lat, y: p.lng };
      const c: Camera = this.nowMarker.attributes;
      this.sqlService.update(Model.TABLE_NAME_MONITOR, data, c.id)
        .subscribe(res => {
          if (res > 0) {
            this.nowMarker.setPosition(p);
          }
        })
    }
  }

  private showAddMarkDialog(p) {
    const dialogRef = this.dialog.open(EditMarkComponent, {
      disableClose: true,
      data: { flag: 'add', x: p.lat, y: p.lng }
    });
  }

  private mapLayerChange(isVecLayer) {
    isVecLayer ? this.bdmap.setMapType(BMAP_SATELLITE_MAP) : this.bdmap.setMapType(BMAP_NORMAL_MAP)
  }

  showSearchMark(item) {
    let camera = Camera.toCamera(item);
    let zoom = camera.displayLevel;
    const center = new BMap.Point(camera.y, camera.x);
    this.bdmap.centerAndZoom(center, zoom)
    this.focusMarkID = camera.id;
  }
}
