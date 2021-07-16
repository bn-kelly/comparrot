import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DateAgoPipe } from './date-ago.pipe';
import { NameInitialsPipe } from './name-initials.pipe';
import { OrderByPipe } from './order-by.pipe';

const pipes = [
  DateAgoPipe,
  NameInitialsPipe,
  OrderByPipe
];

@NgModule({
  declarations: [...pipes],
  imports: [
    CommonModule
  ],
  exports: [
    ...pipes
  ]
})
export class PipesModule { }
