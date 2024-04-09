import {arrow, autoPlacement, autoUpdate, computePosition, offset, Placement, shift} from "@floating-ui/dom";
import type Window from "./@types/index.d.ts";

let cleanup = null;
window.nextTooltip = (refID: string, placement: string[], removeID: string) => {
    if (removeID !== null) {
        tooltipOff(document.getElementById(removeID + "-tooltip"));
        cleanup();
    }
    if (refID !== null) {
        let ref = document.getElementById(refID);
        let tooltip = document.getElementById(refID + "-tooltip");
        let arrow = document.getElementById(refID + "-arrow");
        cleanup = autoUpdate(
            ref,
            tooltip,
            () => tooltipOn(ref, tooltip, arrow, placement)
        )
    }
}

const tooltipOn = (ref: HTMLElement, tooltip: HTMLElement, arrowElement: HTMLElement, prefPlacement: string[]) => {
    tooltip.style.display = "block";
    computePosition(ref, tooltip, {
        middleware: [
            autoPlacement({allowedPlacements: prefPlacement as Placement[]}),
            shift({padding: 3}),
            offset(2),
            arrow({element: arrowElement}),
        ]
    }).then(({x, y, placement, middlewareData}) => {
        Object.assign(tooltip.style, {
            left: `${x}px`,
            top: `${y}px`
        });

        const {x: arrowX, y: arrowY} = middlewareData.arrow;
        const staticSide = {
            top: 'bottom',
            right: 'left',
            bottom: 'top',
            left: 'right',
        }[placement.split('-')[0]];

        const border = "var(--bs-border-width) var(--bs-border-style)"

        const borderTop = placement.includes("left")
            || placement.includes("bottom") ? border : "";
        const borderRight = placement.includes("left")
            || placement.includes("top") ? border : "";
        const borderBottom = placement.includes("right")
            || placement.includes("top") ? border : "";
        const borderLeft = placement.includes("right")
        || placement.includes("bottom") ? border : "";

        Object.assign(arrowElement.style, {
            left: arrowX != null ? `${arrowX}px` : '',
            top: arrowY != null ? `${arrowY}px` : '',
            right: '',
            bottom: '',
            [staticSide]: '-4px',
            borderTop: borderTop,
            borderRight: borderRight,
            borderBottom: borderBottom,
            borderLeft: borderLeft,
        });
    });
}

const tooltipOff = (tooltip: HTMLElement) => {
    tooltip.style.display = "none";
}

