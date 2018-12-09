import { Component } from '@angular/core';
import { NavController, MenuController, AlertController, Platform } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { AuthService } from '../../service/auth.service';
import { File } from '@ionic-native/file';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { FolderPage } from '../folder/folder';
import { AddFolderPage } from '../add-folder/add-folder';
import { EditFolderPage } from '../edit-folder/edit-folder';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {

  data = this.auth.getEmail();
  dataPhone = this.auth.getPhone();
  dbName: any;
  name: any;
  folders:any = [];
  totalFolder = 0;
  folder = { name:""};
  thisDate: String = new Date().toISOString();
  totalImgPass = 0;
  totalImgID = 0;
  totalImgDoc = 0;
  nameDB = this.auth.getNameDb();

  constructor(public navCtrl: NavController,
    private sqlite: SQLite,
    private auth: AuthService,
    private file: File,    
    public menuCtrl:MenuController,  
    public httpClient: HttpClient,
    public alertCtrl: AlertController,
    private platform: Platform
    ) { 
    this.menuCtrl.enable(true, 'myMenu');
  }

  ionViewWillEnter() {
    this.getData();  
  }

  getDbName() {  
    if (this.data!=null) {
      let emailName = this.data.substr(0,this.data.lastIndexOf('@'));
      let emailNameLower = emailName.toLowerCase();
      this.dbName = emailNameLower + '.db';
    }
    else {
      let cutString = this.dataPhone.substr(this.dataPhone.lastIndexOf('+')+3);
      let number = '0' + cutString;
      this.dbName = number + '.db';
    }
    return this.dbName;
  }

  getName() {
    if (this.data!=null) {
      let emailName = this.data.substr(0,this.data.lastIndexOf('@'));
      this.name = emailName.toLowerCase();
    }
    else {      
      let cutString = this.dataPhone.substr(this.dataPhone.lastIndexOf('+')+3);
      this.name = '0' + cutString;
    }
    return this.name;
  }

  getData(){   
    this.getDbName();
    this.getName();
    this.platform.ready().then(() => {
      this.sqlite.create({
        name: this.dbName,
        location: 'default'
      }).then((db: SQLiteObject) => {   
      /*  db.executeSql('DROP TABLE IF EXISTS folder', {} as any)
        .then(res => console.log('Deleted Folder table'))
        .catch(e => console.log(e));
        db.executeSql('DROP TABLE IF EXISTS image', {} as any)
        .then(res => console.log('Deleted Image table'))
        .catch(e => console.log(e));     */
        db.executeSql('SELECT * FROM folder ORDER BY folderid DESC', {} as any)
        .then(res => {
          this.folders = [];
          for(var i=0; i<res.rows.length; i++) {
            this.folders.push({
              folderid:res.rows.item(i).folderid,
              name:res.rows.item(i).name,
              date:res.rows.item(i).date,
              type:res.rows.item(i).type,
              display:res.rows.item(i).display
            })
          }
        }).catch(e => console.log('Select nothing from Folder table: ' + e.message));
        db.executeSql('SELECT COUNT(folderid) AS totalFolder FROM folder WHERE display="yes"', {} as any)
        .then(res => {
          if(res.rows.length>0) {
            this.totalFolder = parseInt(res.rows.item(0).totalFolder);
          }
        }).catch(e => console.log('Count nothing from Folder table: ' + e.message));                         
      }).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));    
    }).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));
  }

  addFolder() {
    this.navCtrl.push(AddFolderPage,{
      dbName: this.dbName,
      name: this.name
    });
  }

  editFolder(folderid,name) {
    this.navCtrl.push(EditFolderPage, {
      folderid:folderid,
      foldername:name
    });
  }

  moveToFolder(folderid,name){
    this.navCtrl.push(FolderPage, {
      folderid:folderid,      
      foldername:name
    });
  }

  deleteFolder(folderid) {
    this.getDbName();
    this.getName();
    this.platform.ready().then(() => {
      let prompt = this.alertCtrl.create({
        title: 'Bạn có đồng ý xóa thư mục?',
        buttons: [
        { text: 'Hủy',
        handler: data => { console.log('Cancel clicked'); }
      },
      { text: 'OK',
      handler: data => {
        this.sqlite.create({
          name: this.dbName,
          location: 'default'
        }).then((db: SQLiteObject) => {
          db.executeSql('SELECT name FROM folder WHERE folderid=?', [folderid])
          .then(res => {
            if(res.rows.length > 0) {            
              this.folder.name = res.rows.item(0).name;
            }
            let path = this.file.externalRootDirectory + 'IonScan';
            this.file.removeRecursively(path, this.folder.name).catch(e => console.log('Folder didn\'t remove in device: ' + e.message));          
          }).catch(e => console.log('Folder didn\'t remove: ' + e.message));
          db.executeSql('DELETE FROM folder WHERE folderid=?', [folderid]).then(res => { 
            this.getData();        
          }).catch(e => console.log('Folder didn\'t remove in table: ' + e.message));
        }).catch(e => console.log('SQLite didn\'t create: ' + e.message));
      }}]
    });prompt.present();    
    }).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));  
  }

}
