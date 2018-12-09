import { Injectable } from '@angular/core';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Injectable()
export class AuthService {

	private user: firebase.User;
	nameDB: string;

	constructor(public afAuth: AngularFireAuth) {
		afAuth.authState.subscribe(user => {
			this.user = user;
		});
	}

	signInWithEmail(credentials) {
		console.log('Sign in with email');
		return this.afAuth.auth.signInWithEmailAndPassword(credentials.email,
			credentials.password);
	}

	signUp(credentials) {
		return this.afAuth.auth.createUserWithEmailAndPassword(credentials.email, credentials.password);
	}

	get authenticated(): boolean {
		return this.user !== null;
	}

	getEmail() {
		return this.user && this.user.email;
	}

	getPhone() {
		return this.user && this.user.phoneNumber;
	}

	getNameDb(){
		if(this.getEmail()!=null){
			let name = this.getEmail();
			let nameEmail = name.substr(0,name.lastIndexOf('@'));
			this.nameDB = nameEmail + '.db';
		}
		else {
			let name = this.getPhone();
			let namePhone = name.substr(name.lastIndexOf('+')+1);
			let nameDBPhone = 'u' + namePhone;
			this.nameDB = nameDBPhone + '.db';
		}
		return this.nameDB;
	}

	signOut(): Promise<void> {
		return this.afAuth.auth.signOut();
	}

	resetPassword(email: string) {
		return this.afAuth.auth.sendPasswordResetEmail(email);
	}

}