import { Component, OnInit } from '@angular/core';
import { ProductosService } from 'src/app/Servicios/productos.service';
import { ServiciosService } from 'src/app/Servicios/servicios.service';
import { FacturaService } from 'src/app/Servicios/factura.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Producto } from 'src/app/Interfaces/producto';
import { Factura } from 'src/app/Interfaces/factura';
import { DetalleFactura } from 'src/app/Interfaces/detalle-factura';
import { DatePipe } from '@angular/common';
import { BusinessService } from 'src/app/Servicios/business.service';
import { PersonaService } from 'src/app/Servicios/persona.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogoErroresComponent } from 'src/app/Include/dialogo-errores/dialogo-errores.component';
import { Persona } from 'src/app/Interfaces/persona';
import { User } from 'src/app/Interfaces/user';
import { Ilista } from 'src/app/Interfaces/ilista';
import { Servicio } from 'src/app/Interfaces/servicio';
import { FacturaHelper } from 'src/app/Helpers/factura-helper';
import { DetalleFacturaHelper } from 'src/app/Helpers/detalle-factura-helper';
import { TipoFactura } from 'src/app/Utils/factura.constants';
import { TipoProducto } from 'src/app/Utils/producto.constants';
import { TipoPersona } from 'src/app/Utils/persona.constants';
import { FormControl } from '@angular/forms';
import { DialogoConfirmacionComponent } from 'src/app/Include/dialogo-confirmacion/dialogo-confirmacion.component';
import { DateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  insertColumn: string[];
  addColumn: string[];
  principalColumns: string[];
  dispColumn: string[];
  dynamicColumns: string[];
  displayedColumns: string[];
  factura: Factura;
  transactions: DetalleFactura[];
  dataSource = new BehaviorSubject([]);
  chkAll = false;
  errorStock: boolean;
  producto$: Observable<Producto>;
  servicio$: Observable<Servicio>;
  persona$: Observable<Persona>;
  clientes$: Observable<Persona[]>;
  proveedores$: Observable<Persona[]>;
  alertas: Ilista[];
  fecha: string;
  myControl = new FormControl();

  constructor(private businessService: BusinessService,
    private productosService: ProductosService,
    private serviciosService: ServiciosService,
    private personaService: PersonaService,
    private facturaService: FacturaService,
    private datepipe: DatePipe,
    private dialogo: MatDialog,
    private dateAdapter: DateAdapter<Date>) { }

  ngOnInit() {
    this.assignValues();
    this.dataSource.next(this.transactions);
    this.factura.detalle.push(this.transactions[0]);
    this.clientes$ = this.personaService.getPersonas(TipoPersona.Cliente);
    this.proveedores$ = this.personaService.getPersonas(TipoPersona.Proveedor);
    this.displayedColumns = this.insertColumn.concat(this.addColumn, this.principalColumns, this.dispColumn, this.dynamicColumns);
    this.dateAdapter.setLocale('en-GB');
  }

  buscaCliente(codigo: string) {
    this.clientes$ = this.personaService.getClientesFiltro(codigo);
  }

  buscaProveedor(codigo: string) {
    this.proveedores$ = this.personaService.getProveedoresFiltro(codigo);
  }

  // Se validan campos vacíos antes de generar factura
  OnSubmit() {
    const errores = this.validaCampos();
    if (!errores.length) {
      this.getPersona();
      this.dialogo.open(DialogoConfirmacionComponent, {
        data: 'Desea generar la factura?'
      }).afterClosed()
        .subscribe((confirmado: boolean) => {
          if (confirmado) {
            this.generaFactura();
          }
        });
    } else {
      this.dialogo.open(DialogoErroresComponent, {
        data: errores
      });
      // let timeOut = 1500;
      // errores.forEach((message, index) => {
      //   setTimeout(() => {
      //     this.businessService.getAlert(message);
      //   }, index * (timeOut + 350)); // 500 => timeout between two messages
      // });
    }
  }

  generaFactura() {
    let fact = this.factura;
    fact.hora = this.datepipe.transform(new Date(), 'HH:mm:ss');
    fact.fecha = this.datepipe.transform(new Date(this.fecha), 'yyyy-MM-dd');
    fact = FacturaHelper.limpiaPosiciones(fact);
    if (fact.tipo == TipoFactura.FacturaCompra) { // Si es verdadero es factura de compra
      this.facturaService.creaFacturaCompra(fact).subscribe(() => {
        this.businessService.getAlert('Insumos actualizados correctamente');
        this.reset();
      });
    } else if (fact.tipo == TipoFactura.FacturaVenta) {                    // Factura de venta
      this.facturaService.creaFacturaVenta(fact).subscribe((nroFactura: number) => {
        if (nroFactura) {
          this.factura.codFactura = nroFactura;
          this.businessService.getAlert('Factura creada correctamente');
          this.alertStock();
          const doc = this.generarFactura();
          this.reset();
          this.enviar(fact, doc);
        }
      });
    } else {                                                          // Cotizacion
      this.facturaService.creaCotizacion(fact).subscribe((nroCotizacion: number) => {
        if (nroCotizacion) {
          this.businessService.getAlert('Cotización creada correctamente');
          this.alertStock();
          const doc = this.generarCotizacion();
          this.reset();
          //this.enviar(fact, doc);
        }
      });
    }
  }

  //Genera nueva posición
  btnClick() {
    let newID = 0;
    try {
      newID = this.transactions[this.transactions.length - 1].posicion + 1;
    } catch (error) {
      newID = 0;
    }
    const registro: DetalleFactura = {
      posicion: newID,
      tipo: TipoProducto.Insumo,
      dcto: 0,
      producto: {
        id: ''
      },
      servicio: {
        id: ''
      }
    };
    this.transactions.push(registro);
    this.factura.detalle = this.transactions;
    this.dataSource.next(this.transactions);
  }

  // Limpia posiciones según las que estén marcadas
  clear() {
    const array = [];
    this.transactions.forEach(transaction => {
      if (!transaction.insert) {
        array.push(transaction);
      }
    });
    if (array.length < this.transactions.length) {
      this.transactions = array;
      this.dataSource.next(this.transactions);
      this.factura.detalle = this.transactions;
      this.chkAll = false;
      this.businessService.getAlert('Posiciones seleccionadas eliminadas');
    } else {
      this.businessService.getAlert('No se eliminaron posiciones');
    }
  }

  // Se ejecuta al generarse la factura, limpia todos los campos
  reset() {
    this.transactions = [{ 
      tipo: TipoProducto.Insumo,
      producto: { 
        id: '' 
      }, 
      servicio: { 
        id: '' 
      }, 
      dcto: 0,
      posicion: 0 
    }];
    this.dataSource.next(this.transactions);
    this.factura = {
      tipo: TipoFactura.FacturaVenta,
      persona: {
        tipo: TipoPersona.Cliente
      }
    };
    this.factura.detalle = this.transactions;
    this.fecha = null;
  }

  // Alerta todos los productos que se encuentren bajo el stock crítico
  alertStock() {
    const arr = [];
    this.transactions.forEach(det => {
      if (det.tipo == TipoProducto.Insumo) {
        const producto = det.producto;
        const cantidadFinal = producto.stock - det.cantidad;
        if (cantidadFinal <= 0) {
          arr.push({
            tipo: 'danger',
            nombre: `${producto.nombre} (${producto.id}) se encuentra sin stock`,
          });
        } else if (cantidadFinal < det.producto.stockCritico) {
          arr.push({
            tipo: 'warning',
            nombre: `${producto.nombre} (${producto.id}) bajo de stock crítico`,
          });
        }
      }
    });
    this.alertas = Array.from(arr);
  }

  // Cierra las alertas de stock
  close(alert: Ilista) {
    this.alertas.splice(this.alertas.indexOf(alert), 1);
  }

  // Selecciona todas las posiciones
  selectAll() {
    this.transactions.map(transac => transac.insert = this.chkAll);
    this.dataSource.next(this.transactions);
  }

  //Busca un producto a la BD para enlazarlo al detalle
  findProduct(datpos: DetalleFactura) {
    let modificado: boolean;
    let prd = datpos.producto;
    if (prd.id) {
      this.producto$ = this.productosService.getProducto(prd.id);
      this.producto$.subscribe(producto => {
        for (let i = 0; i < this.transactions.length; i++) {
          const element = this.transactions[i];
          if (element.posicion == datpos.posicion && producto) {
            prd = producto;
            modificado = true;
            datpos.cantidad = 1;
            break;
          } else {
            prd = {
              id: prd.id
            };
          }
        }
        datpos.producto = prd;
      });
      modificado ? this.dataSource.next(this.transactions) : 0;
    }
  }

  //Busca un servicio a la BD para enlazarlo al detalle
  findService(datpos: DetalleFactura) {
    let modificado: boolean;
    let srv = datpos.servicio;
    if (srv.id) {
      this.servicio$ = this.serviciosService.getServicio(srv.id);
      this.servicio$.subscribe(servicio => {
        for (let i = 0; i < this.transactions.length; i++) {
          const element = this.transactions[i];
          if (element.posicion == datpos.posicion && servicio) {
            srv = servicio;
            modificado = true;
            break;
          } else {
            srv = {
              id: srv.id
            };
          }
        }
        datpos.servicio = srv;
      });
      modificado ? this.dataSource.next(this.transactions) : 0;
    }
  }

  assignValues() {
    this.insertColumn = ['insert'];
    this.addColumn = ['add'];
    this.principalColumns = ['item', 'name', 'cant'];
    this.dispColumn = ['disp'];
    this.dynamicColumns = ['cost', 'dcto', 'subtotal'];
    this.displayedColumns = [];
    this.transactions = [{
      dcto: 0,
      posicion: 0,
      tipo: TipoProducto.Insumo,
      producto: {
        id: ''
      },
      servicio: {
        id: ''
      }
    }];
    this.factura = {
      persona: {
        rut: ''
      },
      tipo: TipoFactura.FacturaVenta,
      detalle: []
    };
  }

  // Validación si existe algún campo que falte por rellenar
  validaCampos() {
    const log = [];
    const f = this.factura;
    const texto = f.persona?.tipo == TipoPersona.Cliente ? 'Proveedor' : 'Cliente';
    if (f.codFactura == 0 && f.tipo == TipoFactura.FacturaCompra) {
      log.push('Ingrese código de factura');
    }
    if (f.persona.rut == undefined || f.persona.rut == '') {
      log.push(`Ingrese rut de ${texto}`);
    }
    if (this.fecha == undefined) {
      log.push('Ingrese una fecha válida');
    }
    if (f.tipo == undefined) {
      log.push('Ingrese tipo de factura');
    }
    this.transactions.forEach(function (pos, index) {
      const msg = `Pos. ${index + 1} datos incompletos`;
      let error = false;
      if (pos.tipo == TipoProducto.Insumo) {
        error = !pos.producto.nombre ? !error : error;
        error = !pos.producto.precioVenta ? !error : error;
        pos.cantidad > pos.producto.stock && f.tipo == TipoFactura.FacturaVenta
          ? log.push(`No puede exceder al stock actual de posición ${index + 1}`) : 0;
      } else {
        error = !pos.producto.nombre ? !error : error;
        error = !pos.producto.precioVenta ? !error : error;
      }
      !pos.cantidad ? error = true : 0;
      error ? log.push(msg) : 0;
    });
    return log;
  }

  // Switch para cambio de producto a servicio (cantidad fijada en 1)
  asignaCantidad(det: DetalleFactura) {
    det.cantidad = 0;
    det.tipo === TipoProducto.Servicio ? det.cantidad = 1 : 0;
  }

  // Al cambiar a factura de compra todas las posiciones se colocan de tipo P(producto)
  cambiaCompra(fact: Factura) {
    if (fact.tipo === TipoFactura.FacturaCompra || fact.tipo === TipoFactura.CotizacionInsumos) {
      fact.persona.tipo = TipoPersona.Proveedor;
      fact.detalle.forEach(det => {
        det.tipo = TipoProducto.Insumo;
      });
      this.displayedColumns = this.insertColumn.concat(this.principalColumns, this.dynamicColumns);
    } else {
      fact.persona.tipo = TipoPersona.Cliente;
      this.displayedColumns = this.insertColumn.concat(this.addColumn, this.principalColumns, this.dispColumn, this.dynamicColumns);
    }
  }
  // Obtiene el subtotal por posición
  getSubtotal(f: Factura, d: DetalleFactura): number {
    return DetalleFacturaHelper.getSubtotal(d, f.tipo);
  }

  // Obtiene el monto neto de la factura
  getNetAmount(f: Factura): number {
    return FacturaHelper.getNetAmount(f);
  }

  // Obtiene el IVA del monto neto
  getIVA(f: Factura): number {
    return FacturaHelper.getIVA(f);
  }

  // Suma del neto + IVA
  getTotalCost(f: Factura): number {
    return FacturaHelper.getTotalCost(f);
  }

  //Verifica si el rut ingresado existe
  getPersona(): void {
    const person = this.factura.persona;
    const tipo = this.factura.tipo === TipoFactura.FacturaCompra ? TipoPersona.Proveedor : TipoPersona.Cliente;
    this.persona$ = this.personaService.getPersona(person.rut, tipo);
    this.persona$.subscribe(per => {
      this.factura.persona = per;
    });
  }

  enviar(f: Factura, doc: string) {
    setTimeout(() => {
      const user: User = {
        name: f.persona.nombre,
        email: f.persona.email,
        idFactura: f.codFactura,
        pdf: doc
      };

      this.facturaService.sendEmail(user).subscribe(data => {
        console.log(data);
      });
    }, 10000);
  }


  // Genera el PDF de cotización
  generarCotizacion() {
    return this.businessService.generarCotizacion(this.factura, this.fecha);
  }

  // Genera el PDF de factura venta
  generarFactura() {
    return this.businessService.generarFactura(this.factura, this.fecha);
  }
}