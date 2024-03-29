import { Component, OnInit } from '@angular/core';
import { Categoria } from 'src/app/Interfaces/categoria';

@Component({
  selector: 'app-index-categorias',
  template: `<div class="container"> 
                <div class="col">
                  <app-form-categorias (actualiza)="enviaCategoria($event)" [iCategoria]="categoria"></app-form-categorias>
                </div>
                <div class="col">
                  <app-lista-categorias (categoria)="enviaCategoria($event)" [actualiza]="categoria"></app-lista-categorias>
                </div>
              </div>`,
  styles: []
})
export class IndexCategoriasComponent implements OnInit {

  public categoria: Categoria;
  public actualiza: Categoria;

  ngOnInit(): void {
    console.log('index');
  }

  public enviaCategoria(categoria: Categoria) {
    this.categoria = categoria;
  }
}
