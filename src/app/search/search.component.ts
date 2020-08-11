import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SqlService } from '../services/sql.service';
import * as EventBus from 'eventbusjs';
import { EventType } from '../models/event-type';

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {

  keyword:string;
  results:Array<any>;

  constructor(private sqlService:SqlService,private changeDetectorRef: ChangeDetectorRef){

  }

  ngOnInit() {
  }

  onSearch(){
    let sql = `select * from monitor where monitorID like '%${this.keyword}%' or name like '%${this.keyword}%' or owner like '%${this.keyword}%'`;
    this.sqlService.execSql(sql,'select').subscribe(
      res=>{
        console.log(res);
        this.results = res;
        this.changeDetectorRef.detectChanges();
      }
    )
  }

  onClickItem(item){
    EventBus.dispatch(EventType.SHOW_SEARCH_MARK,item)
    EventBus.dispatch(EventType.CLOSE_DRAWER)
  }
}
