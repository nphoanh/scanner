import { Component } from '@angular/core';
import { IonicPage, NavController, AlertController, MenuController, Platform } from 'ionic-angular';
import { User } from '../../models/user';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Toast } from '@ionic-native/toast';
import { File } from '@ionic-native/file';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { NgProgress } from '@ngx-progressbar/core';

import { HomePage } from '../home/home';
import { SignupPage } from '../signup/signup';
import { ResetPage } from '../reset/reset';

@IonicPage()
@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})

export class LoginPage {

  user = {} as User;
  dbName: any;
  name: any;
  signin: string = "Email";
  recaptchaVerifier:firebase.auth.RecaptchaVerifier;
  folders: any = [];
  totalFolder = 0;
  folder = { name:"" };
  thisDate: String = new Date().toISOString();
  pathRoot: any;
  pathFolder: any;

  constructor(
    public navCtrl: NavController, 
    public alertCtrl: AlertController,
    private afAuth: AngularFireAuth,
    private toast: Toast,
    public menuCtrl:MenuController,   
    private file: File,  
    private sqlite: SQLite,
    public progress: NgProgress,
    private platform: Platform
    ) {
    this.menuCtrl.enable(false, 'myMenu');
  }

  ionViewWillEnter() {
    this.createRootFolder();
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
      'size': 'invisible',
      'callback': function(response) {
        console.log(response);
      },
      'expired-callback': function() {
      }
    });
  }

  createRootFolder(){
    this.platform.ready().then(() => {
      this.file.createDir(this.file.externalRootDirectory, 'IonScan', false).catch(e => console.log('Folder IonScan didn\'t create: ' + e.message));
    }).catch(e => console.log(e));         
  }

  getDbName() {  
    if (this.user.email!=null) {
      let emailName = this.user.email.substr(0,this.user.email.lastIndexOf('@'));
      let emailNameLower = emailName.toLowerCase();
      this.dbName = emailNameLower + '.db';
    }
    else {
      this.dbName = this.user.phone + '.db';
    }
    return this.dbName;
  }

  getName() {
    if (this.user.email!=null) {
      let emailName = this.user.email.substr(0,this.user.email.lastIndexOf('@'));
      this.name = emailName.toLowerCase();
    }
    else {      
      this.name = this.user.phone;
    }
    return this.name;
  }

  async loginPhone(user){    
    this.getDbName();
    this.getName();    
    try {
      const appVerifier = this.recaptchaVerifier;
      let cutString = user.phone.substr(user.phone.indexOf('0')+1); 
      let numberPhone = '+84' + cutString;      
      await firebase.auth().signInWithPhoneNumber(numberPhone, appVerifier).then(confirmationResult => {             
        this.progress.start();
        let prompt = this.alertCtrl.create({
          title: 'Nhập mã xác thực',
          inputs: [{ name: 'confirmationCode', placeholder: 'Mã xác thực' }],
          buttons: [
          { text: 'Hủy',
          handler: data => { console.log('Cancel clicked'); }
        },
        { text: 'Gửi',
        handler: data => {
          confirmationResult.confirm(data.confirmationCode)
          .then(result => {
            this.sqlite.create({ 
              name: this.dbName,
              location: 'default'
            }).then((db: SQLiteObject) => {
              db.executeSql('CREATE TABLE IF NOT EXISTS folder(folderid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT, type TEXT NOT NULL, display TEXT DEFAULT "yes", UNIQUE(name))', {} as any).catch(e => console.log('Folder table didn\'t create: ' + e.message));
              db.executeSql('CREATE TABLE IF NOT EXISTS image(imageid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, path TEXT, base64 TEXT, type TEXT DEFAULT "image/png", upload INTEGER DEFAULT 0, folderid, UNIQUE(name), FOREIGN KEY(folderid) REFERENCES folder (folderid))', {} as any).catch(e => console.log('Image table didn\'t create: ' + e.message));
              db.executeSql('INSERT INTO folder VALUES (3,"Chứng minh thư",?,"Chứng minh thư","no")', [this.thisDate]).catch(e => console.log('Identity didn\'t add to table: ' + e.message));
              db.executeSql('INSERT INTO folder VALUES (2,"Hộ chiếu",?,"Hộ chiếu","no")', [this.thisDate]).catch(e => console.log('Passport didn\'t add to table: ' + e.message));
              db.executeSql('INSERT INTO folder VALUES (1,"Tài liệu",?,"Tài liệu","no")', [this.thisDate]).catch(e => console.log('Document didn\'t add to table: ' + e.message));
              this.platform.ready().then(() => {
                this.pathRoot = this.file.externalRootDirectory + 'IonScan';
                this.pathFolder = this.pathRoot + '/' + this.name;
                this.file.createDir(this.pathRoot, this.name, false).catch(e => console.log('Folder IonScan didn\'t create: ' + e.message));
                this.file.createDir(this.pathFolder, 'Chứng minh thư', false).catch(e => console.log('Identity didn\'t add to device: ' + e.message));
                this.file.createDir(this.pathFolder, 'Hộ chiếu', false).catch(e => console.log('Passport didn\'t add to device: ' + e.message));
                this.file.createDir(this.pathFolder, 'Tài liệu', false).catch(e => console.log('Document didn\'t add to device: ' + e.message));
                this.file.createDir(this.pathFolder, 'PDF', false).catch(e => console.log('Pdf didn\'t add to device: ' + e.message));                       
              }).catch(e => console.log('Platform didn\'t ready: ' + e.message));;  
            }).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));
            this.navCtrl.setRoot(HomePage);
          }).catch(error => {this.toast.show(error, '5000', 'center').subscribe(toast => {console.log(toast);})
        });
        }}]
      });this.progress.complete();
        prompt.present();
      }).catch(e => this.toast.show(e.message, '5000', 'center').subscribe(toast => console.log(toast))); 
    }
    catch(e) {
      this.toast.show(e.message, '5000', 'center').subscribe(toast => console.log(toast));  
    }
  }

  async login(user: User) {
    this.getDbName();
    this.getName();
    try {
      await this.afAuth.auth.signInWithEmailAndPassword(user.email,user.password).then(e => {
        let users = firebase.auth().currentUser;
        if (users.emailVerified == false) {
          this.toast.show('Email chưa được xác thực', '5000', 'center').subscribe(toast => { console.log(toast);});
        }
        else {
          this.sqlite.create({
            name: this.dbName,
            location: 'default'
          }).then((db: SQLiteObject) => {
            db.executeSql('CREATE TABLE IF NOT EXISTS folder(folderid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, date TEXT, type TEXT, display TEXT DEFAULT "yes", UNIQUE(name))', {} as any).catch(e => console.log('Folder table didn\'t create: ' + e.message));
            db.executeSql('CREATE TABLE IF NOT EXISTS image(imageid INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, date TEXT, path TEXT, base64 TEXT, type TEXT DEFAULT "image/png", upload INTEGER DEFAULT 0, folderid, UNIQUE(name), FOREIGN KEY(folderid) REFERENCES folder (folderid))', {} as any).catch(e => console.log('Image table didn\'t create: ' + e.message));
            db.executeSql('INSERT INTO folder VALUES (3,"Chứng minh thư",?,"Chứng minh thư","no")', [this.thisDate]).catch(e => console.log('Identity didn\'t add to table: ' + e.message));
            db.executeSql('INSERT INTO folder VALUES (2,"Hộ chiếu",?,"Hộ chiếu","no")', [this.thisDate]).catch(e => console.log('Passport didn\'t add to table: ' + e.message));
            db.executeSql('INSERT INTO folder VALUES (1,"Tài liệu",?,"Tài liệu","no")', [this.thisDate]).catch(e => console.log('Document didn\'t add to table: ' + e.message));          
            this.platform.ready().then(() => {
              this.pathRoot = this.file.externalRootDirectory + 'IonScan';
              this.pathFolder = this.pathRoot + '/' + this.name;
              this.file.createDir(this.pathRoot, this.name, false).catch(e => console.log('Folder IonScan didn\'t create: ' + e.message));
              this.file.createDir(this.pathFolder, 'Chứng minh thư', false).catch(e => console.log('Identity didn\'t add to device: ' + e.message));
              this.file.createDir(this.pathFolder, 'Hộ chiếu', false).catch(e => console.log('Passport didn\'t add to device: ' + e.message));
              this.file.createDir(this.pathFolder, 'Tài liệu', false).catch(e => console.log('Document didn\'t add to device: ' + e.message));
              this.file.createDir(this.pathFolder, 'PDF', false).catch(e => console.log('Pdf didn\'t add to device: ' + e.message));                       
            });  
          }).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));  
          this.navCtrl.setRoot(HomePage);
        }
      }).catch(e => this.toast.show(e.message, '5000', 'center').subscribe(toast => console.log(toast)));       
    }
    catch(e) {
      this.toast.show(e.message, '5000', 'center').subscribe(toast => console.log(toast));  
    }
  }

  signup() {
    this.navCtrl.push(SignupPage);
  }

  resetPwd() {
    this.navCtrl.push(ResetPage);
  }

}