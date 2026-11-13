import { Badge, ColorSwatch, type MantineColor } from '@mantine/core';

export type StatusBadgeVariant =
  | 'init'
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'debug';

const badgeStyles: {
  [key in StatusBadgeVariant]: {
    styleColor: MantineColor;
    markColor: string;
    label: string;
  };
} = {
  init: { styleColor: 'gray', markColor: '#adb5bd', label: 'Init' },
  success: { styleColor: 'teal', markColor: '#12b886', label: 'Success' },
  error: { styleColor: 'red', markColor: '#fa5252', label: 'Error' },
  warning: { styleColor: 'orange', markColor: '#fd7e14', label: 'Warning' },
  info: { styleColor: 'cyan', markColor: '#15aabf', label: 'Info' },
  debug: { styleColor: 'grape', markColor: '#be4bdb', label: 'Debug' },
};

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
}

export const StatusBadge = ({ variant }: StatusBadgeProps) => {
  const style = badgeStyles[variant] || badgeStyles.info;
  return (
    <Badge
      size="xs"
      variant="light"
      color={style.styleColor}
      leftSection={
        <ColorSwatch size={8} color={style.markColor} withShadow={false} />
      }
      styles={{
        root: {
          border: `solid 1px ${style.markColor}66`,
        },
      }}
    >
      {style.label}
    </Badge>
  );
};
