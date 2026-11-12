import { useRef } from 'react';

import { Modal } from '@mantine/core';
import { useFocusWithin } from '@mantine/hooks';
import { useAtom } from 'jotai';

import { controlModalAtom } from '@/features/state/atoms';
import { AboutInfoModalContent } from './AboutInfoModal/ModalContent';
import { EditTemplatesModalContent } from './EditTemplatesModal/ModalContent';
import { ExportTemplatesModalContent } from './ExportTemplatesModal/ModalContent';
import { HistoryModalContent } from './HistoryModal/ModalContent';
import { ImportTemplatesModalContent } from './ImportTemplatesModal/ModalContent';
import { LoadTemplateModalContent } from './LoadTemplateModal/ModalContent';
import { OptionsModalContent } from './OptionsModal/ModalContent';
import { PresetTemplatesModalContent } from './PresetTemplatesModal/ModalContent';
import { SaveTemplateModalContent } from './SaveTemplateModal/ModalContent';

export const ModalController = () => {
  const [controlModal, setControlModalAtom] = useAtom(controlModalAtom);
  const focusRef = useRef<HTMLDivElement>(null);
  const { focused } = useFocusWithin();
  const isOptions = controlModal.type === 'options';
  const close = () =>
    setControlModalAtom({ opened: false, type: 'not-active' });

  return (
    <Modal.Root
      opened={controlModal.opened}
      onClose={close}
      closeOnEscape={!focused}
      size={isOptions ? '45rem' : 'lg'}
      centered={isOptions}
      xOffset={isOptions ? '1rem' : undefined}
      yOffset={isOptions ? '1rem' : undefined}
    >
      <Modal.Overlay />
      {controlModal.opened && controlModal.type === 'preset-templates' && (
        <PresetTemplatesModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'save-template' && (
        <SaveTemplateModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'load-template' && (
        <LoadTemplateModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'edit-templates' && (
        <EditTemplatesModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'import-templates' && (
        <ImportTemplatesModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'export-templates' && (
        <ExportTemplatesModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'history' && (
        <HistoryModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'options' && (
        <OptionsModalContent focusRef={focusRef} close={close} />
      )}
      {controlModal.opened && controlModal.type === 'about-info' && (
        <AboutInfoModalContent focusRef={focusRef} close={close} />
      )}
    </Modal.Root>
  );
};
