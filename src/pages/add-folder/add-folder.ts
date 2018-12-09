import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Platform } from 'ionic-angular';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite';
import { AuthService } from '../../service/auth.service';
import { File } from '@ionic-native/file';
import { Toast } from '@ionic-native/toast';

@IonicPage()
@Component({
	selector: 'page-add-folder',
	templateUrl: 'add-folder.html',
})
export class AddFolderPage {
	
	dbName = this.navParams.get('dbName');
	name = this.navParams.get('name');
	thisDate: String = new Date().toISOString();
	folder = { name:"", date:this.thisDate, type:"", display:"yes" };
	data = this.auth.getEmail();
	dataPhone = this.auth.getPhone();
	
	constructor(public navCtrl: NavController, 
		private sqlite: SQLite,
		private auth: AuthService,
		private file: File,
		private toast: Toast,
		public navParams: NavParams,
		private platform: Platform
		) {
	}

	saveFolder() {
		this.platform.ready().then(() => {
			if (this.folder.name!='' && this.folder.type!='') {
				this.sqlite.create({
					name: this.dbName,
					location: 'default'
				}).then((db: SQLiteObject) => {
					db.executeSql('INSERT INTO folder VALUES(NULL,?,?,?,?)',[this.folder.name,this.folder.date,this.folder.type,this.folder.display]).then(res => {																			
					}).catch(e => console.log('Folder didn\'t add to table: ' + e.message));					
				}).catch(e => console.log('SQLite didn\'t create SQLite: ' + e.message));
				let path = this.file.externalRootDirectory + 'IonScan/' + this.name;
				this.file.createDir(path, this.folder.name, false).catch(e => { this.toast.show('Trùng tên thư mục', '5000', 'center').subscribe(toast => console.log(toast))});
				this.navCtrl.popToRoot();
			}
			if (this.folder.name=='' && this.folder.type=='') {
				this.toast.show('Tên và loại thư mục không được để trống', '5000', 'center').subscribe(toast => console.log(toast));
			}
			if (this.folder.name=='' && this.folder.type!='') {
				this.toast.show('Tên thư mục không được để trống', '5000', 'center').subscribe(toast => console.log(toast))
			}
			if (this.folder.name!='' && this.folder.type=='') {
				this.toast.show('Loại thư mục không được để trống', '5000', 'center').subscribe(toast => console.log(toast))
			}			
		}).catch(e => console.log(e));       	
	}
	
}
