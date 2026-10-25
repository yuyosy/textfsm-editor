import {
  Box,
  Divider,
  Group,
  Notification,
  ScrollArea,
  Stack,
  Text,
} from '@mantine/core';
import {
  Dropzone,
  type FileRejection,
  type FileWithPath,
} from '@mantine/dropzone';
import { FileJson, Upload, X } from 'lucide-react';

interface DropzoneSectionProps {
  openRef: React.RefObject<() => void>;
  selectedJsonFiles: File[];
  rejectedFiles: FileRejection[];
  setSelectedJsonFiles: (files: File[]) => void;
  setRejectedFiles: (files: FileRejection[]) => void;
}

export const DropzoneSection = ({
  openRef,
  selectedJsonFiles,
  rejectedFiles,
  setSelectedJsonFiles,
  setRejectedFiles,
}: DropzoneSectionProps) => {
  const handleFilesDrop = (files: FileWithPath[]) => {
    const existingFileNames = new Set(
      selectedJsonFiles.map((item) => item.name),
    );
    setSelectedJsonFiles([
      ...selectedJsonFiles,
      ...files.filter((item) => !existingFileNames.has(item.name)),
    ]);
  };

  const handleFilesReject = (files: FileRejection[]) => {
    const existingFileNames = new Set(
      rejectedFiles.map((item) => item.file.name),
    );
    setRejectedFiles([
      ...rejectedFiles,
      ...files.filter((item) => !existingFileNames.has(item.file.name)),
    ]);
  };

  const removeSelectedFile = (index: number) => {
    if (selectedJsonFiles.length === 0) return;
    setSelectedJsonFiles(selectedJsonFiles.filter((_, i) => i !== index));
  };

  const removeRejectedFile = (index: number) => {
    if (rejectedFiles.length === 0) return;
    setRejectedFiles(rejectedFiles.filter((_, i) => i !== index));
  };

  return (
    <Stack p={8}>
      <Divider my="xs" />
      <Dropzone
        openRef={openRef}
        onDrop={handleFilesDrop}
        onReject={handleFilesReject}
        activateOnClick={false}
        maxSize={3 * 1024 ** 2}
        accept={['application/json']}
        multiple
        p={10}
        style={{ border: '1px dashed #666', borderRadius: '4px' }}
      >
        <Group
          justify="center"
          gap="xl"
          onClick={() => openRef.current?.()}
          style={{ cursor: 'pointer' }}
        >
          <Dropzone.Accept>
            <Upload size={32} strokeWidth={1.2} />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <X size={32} strokeWidth={1.2} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <FileJson size={32} strokeWidth={1.2} />
          </Dropzone.Idle>
          <Box>
            <Text inline>Drag JSON files here or click to select</Text>
          </Box>
        </Group>
        <Divider
          label="Selected Files"
          labelPosition="center"
          variant="dashed"
        />
        <ScrollArea h={250}>
          <Stack gap="xs">
            {selectedJsonFiles.map((item: File, index) => {
              return (
                <Notification
                  key={item.name}
                  title={item.name}
                  onClose={() => removeSelectedFile(index)}
                  py={2}
                  withBorder
                ></Notification>
              );
            })}
            {rejectedFiles.map((item, index) => {
              const errors = item.errors.map((err) => {
                return (
                  <Text
                    size="sm"
                    key={`errormsg_${item.file.name}_${err.code}_${err.message}`}
                  >
                    {err.message}
                  </Text>
                );
              });
              return (
                <Notification
                  key={`error_${item.file.name}`}
                  title={item.file.name}
                  color="red"
                  onClose={() => removeRejectedFile(index)}
                  py={2}
                  withBorder
                >
                  {errors}
                </Notification>
              );
            })}
          </Stack>
        </ScrollArea>
      </Dropzone>
    </Stack>
  );
};
