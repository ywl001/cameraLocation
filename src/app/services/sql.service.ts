import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Model } from '../models/model';

@Injectable({
  providedIn: 'root'
})
export class SqlService {

  ACTION_SELECT = 'select';
  private ACTION_INSERT = 'insert';
  private ACTION_DELETE = 'delete';
  private ACTION_UPDATE = 'update';

  constructor(private http: HttpClient) { }

  /**
   * 获取当前范围内的监控
   * @param xmin 
   * @param xmax 
   * @param ymin 
   * @param ymax 
   * @param mapLevel 
   */
  getMonitorsByExtent(xmin: number, ymin: number, xmax: number, ymax: number, mapLevel: number) {
    const sql = `select m.*,u.realName insertUser from monitor m 
                left join user u on m.userID = u.id 
                where m.x > ${xmin} 
                and m.y > ${ymin} 
                and m.x < ${xmax} 
                and m.y < ${ymax} 
                and m.displayLevel <= ${mapLevel}`;
    return this.execSql(sql, this.ACTION_SELECT);
  }

  getMarkImages(markID) {
    const sql = `select * from ${Model.TABLE_NAME_MONITOR_IMAGE} where monitorID = ${markID}`;
    return this.execSql(sql, this.ACTION_SELECT);
  }

  insert(tableName, data) {
    let sql: string = `insert into ${tableName} (`;

    Object.keys(data).forEach(key => {
      sql += key + ",";
    })

    sql = sql.substring(0, sql.length - 1) + ") values (";

    Object.keys(data).forEach(key => {
      const value = data[key];
      if (value == "now()")//php now（）函数，不能带引号
        sql += value + ",";
      else
        sql += "'" + value + "',";
    })

    sql = sql.substring(0, sql.length - 1) + ")";
    console.log(sql);
    return this.execSql(sql, this.ACTION_INSERT);
  }

  update(tableName, data, id) {
    let sql = "update " + tableName + " set ";

    Object.keys(data).forEach(key => {
      const value = data[key];
      sql += (key + "='" + value + "',");
    })
    sql = sql.substring(0, sql.length - 1) + " where id =" + id;
    console.log(sql);
    return this.execSql(sql, this.ACTION_UPDATE);
  }

  delete(tableName,id){
    let sql =  `delete from ${tableName} where id = ${id}`;
    console.log(sql)
    return this.execSql(sql,this.ACTION_DELETE);
  }

  public execSql(sql: string, action: string) {
    return this.http.post<any>(Model.PHP_SQL_URL, { 'sql': sql, 'action': action });
  }
}
