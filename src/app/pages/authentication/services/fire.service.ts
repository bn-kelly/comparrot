import { Injectable } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';

import { Observable, from } from 'rxjs';
import { map, tap, take, switchMap, mergeMap, expand, takeWhile } from 'rxjs/operators';

import * as firebase from 'firebase/app';

export interface Todo {
    description: string;
    completed: boolean;
  }

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
    todoCollectionRef: AngularFirestoreCollection<Todo>;
    todo$: Observable<Todo[]>;
  
    constructor(private afs: AngularFirestore) {
      this.todoCollectionRef = this.afs.collection<Todo>('todos');
      this.todo$ = this.todoCollectionRef.valueChanges();
    }
  }

