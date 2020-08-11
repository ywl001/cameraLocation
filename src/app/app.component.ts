import { Component, ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatDrawer } from '@angular/material';
import { LoginComponent } from './login/login.component';
import * as EventBus from 'eventbusjs';
import { EventType } from './models/event-type';
import { LocalStorgeService } from './services/local-storge.service';
import { Model } from './models/model';

declare var alertify;

import * as toastr from 'toastr'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  title = 'cameras';

  private _isLogined: boolean;
  private _isVecMap: boolean = true;
  btnLoginBg = `url('../assets/login.png')`;
  btnMapTypeBg = `url('../assets/vecmap.png')`;

  private welcome: string = ''

  @ViewChild('drawer', { static: false }) drawer: MatDrawer;

  images;
  imageIndex = -1;
  showFlag = false;

  constructor(
    public dialog: MatDialog,
    private localStorge: LocalStorgeService
  ) {
    EventBus.addEventListener(EventType.LOGIN_SUCCESS, e => { this.isLogined = true })
    EventBus.addEventListener(EventType.CLOSE_DRAWER, e => { this.drawer.close() })
    EventBus.addEventListener(EventType.SHOW_IMAGE, e => { this.onShowImage(e.target)})
  }

  ngOnInit() {
    console.log('init')
    const user_ID = this.localStorge.get('userID');
    console.log(user_ID)
    if (user_ID) {
      this.isLogined = true;
    }
  }

  onLogin() {
    if (!this.isLogined)
      this.dialog.open(LoginComponent)
    else {
      console.log('exit')
      alertify.set({
        labels: {
          ok: "确定",
          cancel: "取消"
        }
      });
      alertify.confirm("确定要退出登录吗？", e => {
        if (e) {
          this.isLogined = false;
        }
      });
    }
  }

  private set isLogined(value) {
    this._isLogined = value;
    if (value) {
      this.btnLoginBg = `url('../assets/exitlogin.png')`;
      this.welcome = "欢迎你，" + this.localStorge.get('realName');
      Model.USER_ID = this.localStorge.get('userID');
      Model.REAL_NAME = this.localStorge.get('realName')
    }
    else {
      this.btnLoginBg = `url('../assets/login.png')`
      this.localStorge.remove('userID')
      this.localStorge.remove('realName');
      this.welcome = ''
      Model.USER_ID = undefined;
      Model.REAL_NAME = undefined;
    }
  }

  private get isLogined() {
    return this._isLogined
  }

  onMapLayerChange() {
    if (this._isVecMap) {
      this.btnMapTypeBg = `url('../assets/imgmap.png')`;
    } else {
      this.btnMapTypeBg = `url('../assets/vecmap.png')`;
    }
    EventBus.dispatch(EventType.MAP_LAYER_CHANGE, this._isVecMap)
    this._isVecMap = !this._isVecMap;
  }

  onSearch() {
    this.drawer.toggle()
  }


  onShowImage(imgObj) {
    console.log('show image');
    this.images = [];
    this.imageIndex = imgObj.index;
    console.log(this.imageIndex)
    const imgs:Array<any> = imgObj.imgs;
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      let o = {
        image: `monitorBaidu/monitor_image/${img.imageUrl}`,
        thumbImage: `monitorBaidu/monitor_image/${img.thumbUrl}`,
      }
      this.images.push(o)
    }
    this.showFlag = true;
    console.log(this.images[0].image)
  }

  closeEventHandler() {
    this.showFlag = false;
    this.imageIndex = -1;
    this.images = undefined;
  }
}

