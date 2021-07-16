import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * @class HomeService
 */

@Injectable()
export class HomeService {
  constructor(private http: HttpClient, private afs: AngularFirestore) {}
}
