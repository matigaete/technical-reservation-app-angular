import { Component, Input, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { Comuna } from 'src/app/Interfaces/comuna';
import { Persona } from 'src/app/Interfaces/persona';
import { Provincia } from 'src/app/Interfaces/provincia';
import { Region } from 'src/app/Interfaces/region';
import { BusinessService } from 'src/app/Servicios/business.service';
import { PersonaService } from 'src/app/Servicios/persona.service';

@Component({
  selector: 'app-create-person',
  templateUrl: './create-person.component.html',
  styles: [`.mat-form-field~.mat-form-field {
                margin-right: 16px;
            }

            .lef{    
                margin-left: 16px; 
            }

            .mat-radio-button~.mat-radio-button {
                margin-left: 8px;
            }

            .card-extend{
              width:100%
            }`]
})
export class CreatePersonComponent implements OnInit {

  @Input() iPersona: Persona;
  public validaRut = new FormControl('', [Validators.required]);
  public validaEmail = new FormControl('', [Validators.required, Validators.email]);
  public validaNombre = new FormControl('', [Validators.required]);
  public validaDireccion = new FormControl('', [Validators.required]);
  public validaFono = new FormControl('', [Validators.maxLength(9)]);
  public personaModel: Persona = {};
  public regiones$: Observable<Region[]>;
  public provincias: Provincia[];
  public comunas: Comuna[];
  public isNew = true;

  constructor(private businessService: BusinessService,
    private personaService: PersonaService) { }

  public ngOnInit(): void {
    this.regiones$ = this.personaService.getRegiones();
    this.regiones$.subscribe((a) => console.log(a));
  }

  public ngDoCheck(): void {
    if (this.iPersona !== undefined) {
      this.actualizaProvincia(this.iPersona[0].region);
      this.actualizaComuna(this.iPersona[0].provincia);
      this.personaModel = this.iPersona[0];
      this.iPersona = undefined;
      this.isNew = false;
    }
  }

  public onSubmit(): void {
    if (this.isNew) {
      this.personaService.creaPersona(this.personaModel).subscribe(() => {
        this.businessService.getAlert('Persona añadida');
        this.nuevaPersona();
      });
    } else { 
      this.personaService.actualizaPersona(this.personaModel).subscribe(() => {
        this.businessService.getAlert('Persona actualizada');
      });
    }
  }

  public nuevaPersona(): void {
    this.personaModel = {};
    this.isNew = true;
  }

  public actualizaProvincia(region: Region): void {
    this.provincias = region.provincias;
  }

  public actualizaComuna(provincia: Provincia): void {
    this.comunas = provincia.comunas;
  }

  public getErrorEmail() {
    if (this.validaEmail.hasError('required')) {
      return 'Debe ingresar un correo';
    }
    return this.validaEmail.hasError('email') ? 'Correo no válido' : '';
  }

  public getErrorRut() {
    if (this.validaRut.hasError('required')) {
      return 'Ingrese rut';
    }
  }

  public getErrorNombre() {
    if (this.validaNombre.hasError('required')) {
      return 'Debe ingresar un nombre';
    }
  }

  public getErrorDireccion() {
    if (this.validaDireccion.hasError('required')) {
      return 'Debe ingresar una dirección';
    }
  }

  public getErrorFono() {
    if (this.validaFono.hasError('required')) {
      return 'Debe ingresar formato de 9 números';
    }
  }

}
