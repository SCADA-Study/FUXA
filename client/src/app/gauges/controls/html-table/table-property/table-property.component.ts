import { Component, EventEmitter, OnInit, Input, Output, ViewChild } from '@angular/core';
import { Subject, ReplaySubject } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatTabGroup } from '@angular/material';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';

import { TranslateService } from '@ngx-translate/core';

import { GaugeTableProperty, TableType, TableOptions, TableColumn, TableRow, TableColumnType } from '../../../../_models/hmi';
import { DataTableComponent } from '../data-table/data-table.component';
import { TableCustomizerComponent, ITableCustom } from '../table-customizer/table-customizer.component';
import { Utils } from '../../../../_helpers/utils';

@Component({
    selector: 'app-table-property',
    templateUrl: './table-property.component.html',
    styleUrls: ['./table-property.component.css']
})
export class TablePropertyComponent implements OnInit {

    @Input() data: any;
    @Output() onPropChanged: EventEmitter<any> = new EventEmitter();
    @Input('reload') set reload(b: any) {
        this._reload();
    }
    @ViewChild('grptabs') grptabs: MatTabGroup;

    tableTypeCtrl: FormControl = new FormControl();
    options = DataTableComponent.DefaultOptions();
    tableType = TableType;
    columnType = TableColumnType;

    private _onDestroy = new Subject<void>();

    constructor(
        private dialog: MatDialog,
        private translateService: TranslateService) { 
        }

    ngOnInit() {
        if (!this.data.settings.property) {
            this.data.settings.property = <GaugeTableProperty>{ id: null, type: this.tableType.data, options: this.options };
            this.onTableChanged();
        } 
        this._reload();
    }

    ngOnDestroy() {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    private _reload() {
        if (this.data.settings.property) {
            this.tableTypeCtrl.setValue(this.data.settings.property.type);
        }
    }

    onTableChanged() {
        this.data.settings.property.options = JSON.parse(JSON.stringify(this.options));
        this.onPropChanged.emit(this.data.settings);
    }

    onAdd() {
        // if (this.grptabs.selectedIndex === 0) { // columns
        //     this.options.columns.push(new TableColumn());
        // } else if (this.grptabs.selectedIndex === 1) { // rows
        //     this.options.rows.push(new TableRow());
        // }

        let dialogRef = this.dialog.open(TableCustomizerComponent, {
            data: <ITableCustom> { 
                columns: JSON.parse(JSON.stringify(this.options.columns)), 
                rows: JSON.parse(JSON.stringify(this.options.rows)),
                type: <TableType>this.data.settings.property.type
            },
            position: { top: '60px' }
        });

        dialogRef.afterClosed().subscribe((result: ITableCustom) => {    
            if (result) {
                this.options.columns = result.columns;
                this.options.rows = result.rows;
                this.onTableChanged();
            } 
        });   
    }
}