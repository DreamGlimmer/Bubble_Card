import { isColorCloseToWhite } from "../../tools/style.ts";
import { getIcon, getIconColor, getImage, getName, getState, isEntityType, isStateOn, getWeatherIcon } from "../../tools/utils.ts";
import { getBackdrop } from "./create.ts";
import { addHash, onEditorChange, removeHash } from "./helpers.ts";
import { initializesubButtonIcon } from '../../tools/global-changes.ts';

export function changeEditor(context) {
    const detectedEditor = context.verticalStack.host?.closest('hui-card-preview') || context.verticalStack.host?.closest('hui-card[preview][class]') || context.verticalStack.host?.getRootNode().host?.closest('hui-section[preview][class]');

    // Fix the empty space caused by the pop-ups in the section view
    if (!context.popUp.classList.contains('is-popup-opened') && context.sectionRow.tagName.toLowerCase() === 'hui-card') {
        if (!context.editor && !context.sectionRow.hasAttribute("hidden")) {
            context.sectionRow.toggleAttribute("hidden", true);
            context.sectionRow.style.display = "none";
        } else if (context.editor && context.sectionRow.hasAttribute("hidden")) {
            context.sectionRow.toggleAttribute("hidden", false);
            context.sectionRow.style.display = "";
        }

        // Fix on older Safari versions
        if (context.sectionRowContainer?.classList.contains('card')) {
            if (context.popUp.classList.contains('is-popup-opened')) {
                return;
            }

            if (!context.editor) {
                context.sectionRowContainer.style.display = 'none';
            } else if (context.editor) {
                context.sectionRowContainer.style.display = '';
            }
        }
    }

    if (context.editor || detectedEditor !== null) {
        context.popUp.classList.add('editor');

        if (detectedEditor !== null) {
            context.elements.popUpContainer?.classList.remove('hidden');
        } else {
            context.elements.popUpContainer?.classList.add('hidden');
        }
    } else {
        context.popUp.classList.remove('editor');
        context.elements.popUpContainer?.classList.remove('hidden');
    }
    onEditorChange(context);
}

export function changeStyle(context) {
    initializesubButtonIcon(context);

    const cardLayout = context.config.card_layout;

    if (cardLayout === 'large') {
        if (!context.popUp.classList.contains('large')) {
            context.popUp.classList.add('large');
        }
        if (context.popUp.classList.contains('rows-2')) {
            context.popUp.classList.remove('rows-2');
        } 
    } else if (cardLayout === 'large-2-rows') {
        if (!context.popUp.classList.contains('large')) {
            context.popUp.classList.add('large');
        } 
        if (!context.popUp.classList.contains('rows-2')) {
            context.popUp.classList.add('rows-2');
        } 
    } else {
        context.popUp.classList.remove('large');
        context.popUp.classList.remove('rows-2');
    }

    const state = getState(context);
    const { backdropCustomStyle } = getBackdrop(context);

    let customStyle = '';

    try {
        customStyle = context.config.styles
            ? Function('hass', 'entityId', 'state', 'icon', 'subButtonIcon', 'getWeatherIcon', 'card', `return \`${context.config.styles}\`;`)
              (context._hass, context.config.entity, state, context.elements.icon, context.subButtonIcon, getWeatherIcon, context.popUp)
            : '';
    } catch (error) {
        console.error('Error in generating pop-up custom templates:', error);
    }

    if (context.elements.customStyle) {
        context.elements.customStyle.innerText = customStyle;
    }

    backdropCustomStyle.innerText = customStyle;
}

export function changeTriggered(context) {
    let triggerEntity = context.config.trigger_entity ?? '';
    let triggerState = context.config.trigger_state ?? '';
    let triggerClose = context.config.trigger_close ?? false;
    let triggerEntityState = context._hass.states[triggerEntity]?.state;

    if (!triggerEntity) return;
    if (!triggerState) return;
    if (context.oldTriggerEntityState === triggerEntityState) return;

    if (context.config.hash === location.hash) {
        // Popup is opened: should we close it?
        if (triggerClose && triggerState !== triggerEntityState) {
            removeHash();
        }
    } else {
        // Popup is closed: should we open it?
        if (triggerEntityState === triggerState) {
            addHash(context.config.hash);
        }
    }

    context.oldTriggerEntityState = triggerEntityState;
}