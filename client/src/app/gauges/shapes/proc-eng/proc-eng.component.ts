/**
 * Shape extension
 */
import { Component, Input } from '@angular/core';
import { GaugeBaseComponent } from '../../gauge-base/gauge-base.component';
import { GaugeSettings, GaugeAction, Variable, GaugeStatus, GaugeActionsType, GaugePropertyColor, GaugeProperty } from '../../../_models/hmi';
import { GaugeDialogType } from '../../gauge-property/gauge-property.component';
import { ShapesComponent } from '../shapes.component';

declare var SVG: any;

@Component({
    selector: 'gauge-proc-eng',
    templateUrl: './proc-eng.component.html',
    styleUrls: ['./proc-eng.component.css']
})
export class ProcEngComponent extends GaugeBaseComponent {

    @Input() data: any;

    static TypeId = 'proceng';
    static TypeTag = 'svg-ext-' + ProcEngComponent.TypeId;
    static LabelTag = 'Proc-Eng';

    static actionsType = { hide: GaugeActionsType.hide, show: GaugeActionsType.show, blink: GaugeActionsType.blink, stop: GaugeActionsType.stop,
                        clockwise: GaugeActionsType.clockwise, anticlockwise: GaugeActionsType.anticlockwise, rotate : GaugeActionsType.rotate,
                        move: GaugeActionsType.move };
    constructor() {
        super();
    }

    static getSignals(pro: any) {
        let res: string[] = [];
        if (pro.variableId) {
            res.push(pro.variableId);
        }
        if (pro.alarmId) {
            res.push(pro.alarmId);
        }
        if (pro.actions && pro.actions.length) {
            pro.actions.forEach(act => {
                res.push(act.variableId);
            });
        }
        return res;
    }

    static getActions(type: string) {
        return this.actionsType;
    }

    static getDialogType(): GaugeDialogType {
        return GaugeDialogType.RangeWithAlarm;
    }

    static isBitmaskSupported(): boolean {
        return true;
    }

    static processValue(ga: GaugeSettings, svgele: any, sig: Variable, gaugeStatus: GaugeStatus) {
        try {
            if (svgele.node) {
                let value = parseFloat(sig.value);
                if (Number.isNaN(value)) {
                    // maybe boolean
                    value = Number(sig.value);
                } else {
                    value = parseFloat(value.toFixed(5));
                }
                if (ga.property) {
                    let propValue = GaugeBaseComponent.checkBitmask((<GaugeProperty>ga.property).bitmask, value);
                    let propertyColor = new GaugePropertyColor();
                    if (ga.property.variableId === sig.id && ga.property.ranges) {
                        for (let idx = 0; idx < ga.property.ranges.length; idx++) {
                            if (ga.property.ranges[idx].min <= propValue && ga.property.ranges[idx].max >= propValue) {
                                propertyColor.fill = ga.property.ranges[idx].color;
                            }
                        }
                        if (propertyColor.fill) {
                            svgele.node.setAttribute('fill', propertyColor.fill);
                        }
                    }
                    // check actions
                    if (ga.property.actions) {
                        ga.property.actions.forEach(act => {
                            if (act.variableId === sig.id) {
                                ProcEngComponent.processAction(act, svgele, value, gaugeStatus, propertyColor);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    }

    static processAction(act: GaugeAction, svgele: any, value: any, gaugeStatus: GaugeStatus, propertyColor?: GaugePropertyColor) {
        let actValue = GaugeBaseComponent.checkBitmask(act.bitmask, value);
        if (this.actionsType[act.type] === this.actionsType.hide) {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                let element = SVG.adopt(svgele.node);
                this.runActionHide(element, act.type, gaugeStatus);
            }
        } else if (this.actionsType[act.type] === this.actionsType.show) {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                let element = SVG.adopt(svgele.node);
                this.runActionShow(element, act.type, gaugeStatus);
            }
        } else if (this.actionsType[act.type] === this.actionsType.blink) {
            let element = SVG.adopt(svgele.node);
            let inRange = (act.range.min <= actValue && act.range.max >= actValue);
            this.checkActionBlink(element, act, gaugeStatus, inRange, false, propertyColor);
        } else if (this.actionsType[act.type] === this.actionsType.rotate) {
            ShapesComponent.rotateShape(act, svgele, actValue);
        } else if (ShapesComponent.actionsType[act.type] === ShapesComponent.actionsType.move) {
            ShapesComponent.moveShape(act, svgele, actValue);
        } else {
            if (act.range.min <= actValue && act.range.max >= actValue) {
                var element = SVG.adopt(svgele.node);
                ProcEngComponent.runMyAction(element, act.type, gaugeStatus);
            }
        }
    }

    static runMyAction(element, type, gaugeStatus: GaugeStatus) {
        if (gaugeStatus.actionRef && gaugeStatus.actionRef.type === type) {
            return;
        }
        if (element.timeline) {
            element.timeline().stop();
        }
        if (gaugeStatus.actionRef?.animr) {
            gaugeStatus.actionRef?.animr.unschedule();
        }
        if (ProcEngComponent.actionsType[type] === ProcEngComponent.actionsType.clockwise) {
            gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, 360);
        } else if (ProcEngComponent.actionsType[type] === ProcEngComponent.actionsType.anticlockwise) {
            gaugeStatus.actionRef = ShapesComponent.startRotateAnimationShape(element, type, -360);
        } else if (ProcEngComponent.actionsType[type] === ProcEngComponent.actionsType.stop) {
            ShapesComponent.stopAnimationShape(gaugeStatus, type);
        }
    }
}
