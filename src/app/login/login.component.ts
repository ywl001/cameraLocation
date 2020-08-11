import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material';
import { SqlService } from '../services/sql.service';
import { Model } from '../models/model';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';
import { LocalStorgeService } from '../services/local-storge.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  title = '用户登录'

  isLogin = true;

  userName:string;
  password:string;

  constructor(
    public dialogRef: MatDialogRef<LoginComponent>,
    private localStorge:LocalStorgeService,
    private sqlService:SqlService) { }

  ngOnInit() {
  }

  onLogin(){
    let sql =  `select * from user where userName = '${this.userName}' and password = '${this.password}'`;
    this.sqlService.execSql(sql,'select').subscribe(
      res=>{
        if(res.length > 0){
          console.log('login success')
          let user = res[0];
          Model.USER_ID = user.id;
          Model.REAL_NAME = user.realName;
          this.localStorge.set('userID',user.id);
          this.localStorge.set('realName',user.realName);
          EventBus.dispatch(EventType.LOGIN_SUCCESS,user.realName);

        }else{
          console.log('user or password error')
        }
        this.dialogRef.close()
      }
    )
  }

  onRegister(){
    this.isLogin = false;
    this.title = '用户注册'
  }

  onSubmit(){
    this.dialogRef.close()
  }
  onCancel(){
    this.dialogRef.close()
  }
}
