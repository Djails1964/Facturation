// iconConfig.js - Configuration centralisée des icônes pour s'intégrer avec buttons.css
import {
  FiMove, FiChevronUp, FiChevronDown, FiCopy, FiTrash2, FiClipboard,
  FiEdit, FiEye, FiMail, FiPhone, FiMapPin, FiSlack, FiX, FiUserPlus,
  FiCheck, FiUser, FiShield, FiPrinter, FiDollarSign, FiFile,
  FiCalendar, FiCreditCard, FiClock, FiAlertCircle, FiCheckCircle,
  FiPlus, FiFilter, FiAlertTriangle, FiSave
} from 'react-icons/fi';

import { Link, X, Heart } from 'react-feather';
import { LuUnlink } from 'react-icons/lu';

// Configuration centralisée des icônes pour l'application
export const ICONS = {
  // Actions principales
  SAVE: FiSave,
  EDIT: FiEdit,
  DELETE: FiTrash2,
  COPY: FiCopy,
  MOVE: FiMove,
  ADD: FiPlus,
  CLOSE: FiX,
  CANCEL: FiX,
  CONFIRM: FiCheck,
  VIEW: FiEye,
  PRINT: FiPrinter,

  // Navigation et UI
  CHEVRON_UP: FiChevronUp,
  CHEVRON_DOWN: FiChevronDown,
  FILTER: FiFilter,
  CLIPBOARD: FiClipboard,

  // Contact et communication
  MAIL: FiMail,
  PHONE: FiPhone,
  LOCATION: FiMapPin,
  SLACK: FiSlack,
  LINK: Link,
  UNLINK: LuUnlink,

  // Utilisateurs et permissions
  USER: FiUser,
  USER_ADD: FiUserPlus,
  SHIELD: FiShield,

  // Finance et business
  MONEY: FiDollarSign,
  CREDIT_CARD: FiCreditCard,

  // Documents et temps
  FILE: FiFile,
  CALENDAR: FiCalendar,
  CLOCK: FiClock,

  // États et notifications
  SUCCESS: FiCheckCircle,
  WARNING: FiAlertTriangle,
  ERROR: FiAlertCircle,
  INFO: FiAlertCircle,

  // Spéciaux
  HEART: Heart,
  CLOSE_ALT: X // Alternative à FiX de react-feather
};

// Types d'actions pour une cohérence sémantique
export const ACTION_ICONS = {
  // Actions CRUD
  CREATE: ICONS.ADD,
  READ: ICONS.VIEW,
  UPDATE: ICONS.EDIT,
  DELETE: ICONS.DELETE,
  
  // Actions de formulaire
  SUBMIT: ICONS.CHECK,
  RESET: ICONS.X,
  SAVE: ICONS.SAVE,
  
  // Actions de navigation
  BACK: ICONS.CHEVRON_UP,
  NEXT: ICONS.CHEVRON_DOWN,
  
  // Actions de communication
  SEND_EMAIL: ICONS.MAIL,
  CALL: ICONS.PHONE,
  
  // Actions sur documents
  DUPLICATE: ICONS.COPY,
  EXPORT: ICONS.PRINTER,
  DOWNLOAD: ICONS.FILE
};

// Groupes d'icônes par domaine fonctionnel
export const ICON_GROUPS = {
  FORMS: {
    SAVE: ICONS.SAVE,
    EDIT: ICONS.EDIT,
    DELETE: ICONS.DELETE,
    CANCEL: ICONS.CANCEL,
    CONFIRM: ICONS.CONFIRM
  },
  
  NAVIGATION: {
    UP: ICONS.CHEVRON_UP,
    DOWN: ICONS.CHEVRON_DOWN,
    CLOSE: ICONS.CLOSE
  },
  
  CONTACT: {
    EMAIL: ICONS.MAIL,
    PHONE: ICONS.PHONE,
    LOCATION: ICONS.LOCATION
  },
  
  STATUS: {
    SUCCESS: ICONS.SUCCESS,
    WARNING: ICONS.WARNING,
    ERROR: ICONS.ERROR
  },
  
  FINANCE: {
    PAYMENT: ICONS.CREDIT_CARD,
    MONEY: ICONS.MONEY,
    INVOICE: ICONS.FILE
  }
};