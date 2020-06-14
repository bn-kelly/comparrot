import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/firestore';
import { Bot } from './bot.model';

@Component({
  selector: 'fury-bot-delete',
  templateUrl: './bot-delete.component.html',
  styleUrls: ['./bot-delete.component.scss']
})
export class BotDeleteComponent implements OnInit {
  form: FormGroup;

  constructor(@Inject(MAT_DIALOG_DATA) public defaults: any,
              private afs: AngularFirestore,
              private dialogRef: MatDialogRef<BotDeleteComponent>,
              private fb: FormBuilder) {
  }

  ngOnInit() {
    const { name, id, job, site, active, status, proxy, project } = this.defaults || {};

    this.form = this.fb.group({
      name,
      id,
      job,
      site,
      active,
      status,
      proxy,
      project,
    });
  }

  deleteBot() {
    const bot = this.form.value;
    this.afs.collection('bots').doc(bot.id).delete();
    this.dialogRef.close(bot);
  }
}
