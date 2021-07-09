import { AngularFirestore } from '@angular/fire/firestore';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

/**
 * @class DealsService
 */

@Injectable()
export class DealsService {
  constructor(private http: HttpClient, private afs: AngularFirestore) {}
}
