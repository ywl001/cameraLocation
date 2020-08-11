import { Component, OnInit, Input } from '@angular/core';
import { Camera } from '../models/camera';
import { SqlService } from '../services/sql.service';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import { FileUploader } from 'ng2-file-upload';
import { Model } from '../models/model';
import { CameraImage } from '../models/cameraImage';
import * as toastr from 'toastr'
import { MatDialog } from '@angular/material';
import { EditMarkComponent } from '../edit-mark/edit-mark.component';

declare var alertify;

@Component({
  selector: 'app-marker-info',
  templateUrl: './marker-info.component.html',
  styleUrls: ['./marker-info.component.css']
})
export class MarkerInfoComponent implements OnInit {

  @Input() camera:Camera;

  private uploadUrl = "/monitorBaidu/upload.php";

  imgUrls:string[];

  uploader:FileUploader = new FileUploader({url: this.uploadUrl,itemAlias:'Filedata'});

  constructor(private sqlService:SqlService,public dialog: MatDialog,) { 
    console.log("info constructor");
    
    this.uploader.response.subscribe( res =>{this.insertImageData(res)} );
  }

  ngOnInit() {
    if(this.camera){
      this.getImages();
    }
  }

  private getImages() {
    this.sqlService.getMarkImages(this.camera.id)
    .subscribe(res=>{
      if(res && res.length > 0){
        this.imgUrls = res;
        console.log(res);
      }
    })
  }

  onImageLoad(){
    console.log("image load...");
    EventBus.dispatch(EventType.MARKER_IMAGE_LOADED);
  }

  onImageLoadError($event){
    this.imgUrls = undefined;
  }

  onImageClick(currentIndex){
    EventBus.dispatch(EventType.SHOW_IMAGE,{imgs:this.imgUrls,index:currentIndex})
  }

  onAddFile(){
    document.getElementById("inputFile").click();
  }

  onUpload(e){
    console.log(e);
    this.uploader.uploadAll();
  }

  onMove(){
    toastr.options.timeOut = 0;
    EventBus.dispatch(EventType.HIDE_INFO_WINDOW);
    EventBus.dispatch(EventType.SET_CURSOR,EventType.CURSOR_CROSSHAIR);
    toastr.info('请在要移动的位置上点击');
    EventBus.dispatch(EventType.MOVE_MARKER);
  }

  private insertImageData(res:string){
    const imgurl = res.substr(1);
    const thumbUrl = imgurl.split('.')[0] + '_thumb.jpg';
    console.log(thumbUrl);
    let ci = new CameraImage();
    ci.monitorID = this.camera.id;
    ci.imageUrl = imgurl;
    ci.thumbUrl = thumbUrl;
    ci.insertUser = Model.USER_ID;
    this.sqlService.insert(Model.TABLE_NAME_MONITOR_IMAGE,ci)
    .subscribe(res=>{
      toastr.success('图片上传成功');
      this.getImages();
    })
  }

  onDel(){
    console.log("del:",this.camera.id);
    EventBus.dispatch(EventType.HIDE_INFO_WINDOW);

    alertify.set({
      labels: {
        ok: "确定",
        cancel: "取消"
      }
    });
    alertify.confirm("确定要删除吗？", e => {
      if (e) {
        this.sqlService.delete('monitor',this.camera.id).subscribe(
          res=>{
            console.log('del',res)
            EventBus.dispatch(EventType.REFRESH_MARK)
          }
        )
      }
    });

    
  }

  onEdit(){
    this.dialog.open(EditMarkComponent,{data:{flag:'edit',camera:this.camera}})
  }

}

