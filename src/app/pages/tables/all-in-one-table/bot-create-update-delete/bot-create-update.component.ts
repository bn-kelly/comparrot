import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AngularFirestore } from '@angular/fire/firestore';
import { Bot } from './bot.model';

@Component({
  selector: 'fury-bot-create-update',
  templateUrl: './bot-create-update.component.html',
  styleUrls: ['./bot-create-update.component.scss']
})
export class BotCreateUpdateComponent implements OnInit {
  form: FormGroup;
  mode: 'create' | 'update' = 'create';

  constructor(@Inject(MAT_DIALOG_DATA) public defaults: any,
              private afs: AngularFirestore,
              private dialogRef: MatDialogRef<BotCreateUpdateComponent>,
              private fb: FormBuilder) {
  }

  ngOnInit() {
    if (this.defaults) {
      this.mode = 'update';
    } else {
      this.defaults = {} as Bot;
    }

    const { name, id, job, site, active, status, proxy, project } = this.defaults;

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

  save() {
    if (this.mode === 'create') {
      this.createBot();
    } else if (this.mode === 'update') {
      this.updateBot();
    }
  }

  createBot() {
    const bot = this.form.value;
    this.afs.collection('bots').doc(bot.id).set(bot);
    this.dialogRef.close(bot);
  }

  updateBot() {
    const bot = this.form.value;
    this.afs.collection('bots').doc(bot.id).set(bot);
    this.dialogRef.close(bot);
  }

  isCreateMode() {
    return this.mode === 'create';
  }

  isUpdateMode() {
    return this.mode === 'update';
  }
}
