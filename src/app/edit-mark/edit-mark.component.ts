import { Component, OnInit, ViewChild, ElementRef, Inject } from '@angular/core';
import { CAMERA_TYPES } from '../models/cameraTypes';
import { MatRadioButton, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { fromEvent } from 'rxjs';
import { LocalStorgeService } from '../services/local-storge.service';
import { Model } from '../models/model';
import { SqlService } from '../services/sql.service';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import { Camera } from '../models/camera';
import * as toastr from 'toastr'

@Component({
  selector: 'app-edit-mark',
  templateUrl: './edit-mark.component.html',
  styleUrls: ['./edit-mark.component.css']
})
export class EditMarkComponent implements OnInit {

  title = '添加监控点'
  camera_types = CAMERA_TYPES;

  isShowSelectTypeUI = false;
  isShowZnzUI = false;
  isClickRadio;

  cameraType: string = '';
  cameraAngle: number = 0;
  cameraName: string;
  cameraOwner: string;
  cameraPhone: string;
  cameraNumber: string;
  cameraLevel: string = '16';
  isRunning: boolean = true;

  @ViewChild('znz', { static: false }) znz: ElementRef

  constructor(
    public dialogRef: MatDialogRef<EditMarkComponent>,
    private localStorgeService: LocalStorgeService,
    private sqlService:SqlService,
    //如果添加新mark，data：{x,y,flag:add},如果编辑{camera对象，flag:edit}
    @Inject(MAT_DIALOG_DATA) public data
  ) { }

  ngOnInit() {
    console.log(this.data)
    if(this.data.flag == 'add'){
      this.title = '添加监控点';
    }else{
      this.title = '编辑监控信息';
      let camera:Camera = this.data.camera;
      this.cameraAngle = camera.angle;
      this.cameraLevel = camera.displayLevel + '';
      this.cameraName = camera.name;
      this.cameraNumber = camera.monitorID +'';
      this.cameraOwner = camera.owner;
      this.cameraPhone = camera.telephone;
      this.cameraType = camera.type
    }
  }

  onCameraTypeFocus() {
    this.isShowSelectTypeUI = true;
  }

  onCameraTypeBlur(e) {
    console.log(e.relatedTarget.tagName)
    if (e.relatedTarget.tagName != 'MAT-RADIO-BUTTON') {
      this.isShowSelectTypeUI = false
    }
  }

  onCameraTypeChange(e) {
    this.cameraType = e.value
    this.isShowSelectTypeUI = false;
  }


  onDirectionFocus() {
    this.isShowZnzUI = true;
  }

  onDirectionBlur(e) {
    console.log('blur')
    if (!this.isClickZnz) this.isShowZnzUI = false
  }

  private $move
  private $up;
  private deg;
  private isClickZnz: boolean;

  onMouseDownZnz(e) {
    console.log('down', this.calcDeg(e))
    this.isClickZnz = true;
    this.isShowZnzUI = true;
    this.deg = this.calcDeg(e)
    this.znz.nativeElement.style.transform = `rotate(${this.deg}deg)`

    if (this.$move) this.$move.unsubscribe();
    if (this.$up) this.$up.unsubscribe();

    this.$move = fromEvent(e.target, 'mousemove').subscribe(
      (e: any) => {
        console.log('move:', this.calcDeg(e))
        this.deg = this.calcDeg(e)
        this.znz.nativeElement.style.transform = `rotate(${this.deg}deg)`
      }
    )

    this.$up = fromEvent(window, 'mouseup').subscribe(
      (e: any) => {
        this.cameraAngle = parseInt(this.deg + 90);
        this.isClickZnz = false;
        this.isShowZnzUI = false;
        if (this.$move) this.$move.unsubscribe()
        this.$up.unsubscribe()
      }
    )
  }

  private calcDeg(e: MouseEvent) {
    const w = (<any>(e.target)).offsetWidth;
    let x = e.offsetX - w / 2;
    let y = e.offsetY - w / 2;
    let rad = Math.atan2(y, x);
    return rad * 180 / Math.PI + 90;
  }

  onGetCameraName() {
    this.cameraName = this.localStorgeService.get('cameraName')
  }

  onGetCameraOwner() {
    this.cameraOwner = this.localStorgeService.get('cameraOwner')
  }

  onGetCameraPhone() {
    this.cameraPhone = this.localStorgeService.get('cameraPhone')
  }

  onCancel() {
    this.dialogRef.close()
  }

  onSubmit() {
    if (this.cameraName) this.localStorgeService.set('cameraName', this.cameraName)
    if (this.cameraOwner) this.localStorgeService.set('cameraOwner', this.cameraOwner)
    if (this.cameraPhone) this.localStorgeService.set('cameraPhone', this.cameraPhone)

    if (this.data.flag == 'add') {
      this.sqlService.insert('monitor',this.createData()).subscribe(
        res=>{
          if(res){
            toastr.info('添加成功')
            EventBus.dispatch(EventType.REFRESH_MARK)
          }
        }
      )
    } else if (this.data.flag = 'edit') {
      this.sqlService.update('monitor',this.createData(),this.data.camera.id).subscribe(
        res=>{
          if(res){
            toastr.info('修改成功')
            EventBus.dispatch(EventType.REFRESH_MARK)
          }
        }
      )
    }
    this.dialogRef.close()
  }

  private validate() {

  }

  private createData() {
    let data;
    if(this.data.flag == 'add'){
      data = {
        monitorID: this.cameraNumber,
        name: this.cameraName,
        type: this.cameraType,
        y: this.data.y,
        x: this.data.x,
        owner: this.cameraOwner,
        angle: this.cameraAngle,
        userID: Model.USER_ID,
        displayLevel: this.cameraLevel,
        telephone: this.cameraPhone,
        isRunning: this.isRunning ? 1 : 0
      }
    }else{
      data = {
        monitorID: this.cameraNumber,
        name: this.cameraName,
        type: this.cameraType,
        owner: this.cameraOwner,
        angle: this.cameraAngle,
        displayLevel: this.cameraLevel,
        telephone: this.cameraPhone,
        isRunning: this.isRunning ? 1 : 0
      }
    }
    
    return data;
  }
}
