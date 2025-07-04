/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { FormEvent, ReactElement, ReactNode, useState } from 'react';
import {
    Home,
    Menu as MenuIcon,
    Box,
    FileText,
    Settings,
    Users,
    PlusCircle,
    Repeat,
    CreditCard,
    File,
    Briefcase,
    Clock,
    PieChart,
    Info,
    Radio,
} from 'react-feather';
import CommonProps from '../../common/interfaces/common-props.interface';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { Button, Link } from '$app/components/forms';
import { Breadcrumbs, Page } from '$app/components/Breadcrumbs';
import { DesktopSidebar, NavigationItem } from './components/DesktopSidebar';
import { MobileSidebar } from './components/MobileSidebar';
import { useHasPermission } from '$app/common/hooks/permissions/useHasPermission';
import { BiLogoWhatsapp, BiBuildings, BiWallet, BiFile } from 'react-icons/bi';
import { AiOutlineBank } from 'react-icons/ai';
import { ModuleBitmask } from '$app/pages/settings/account-management/component';
import { QuickCreatePopover } from '$app/components/QuickCreatePopover';
import { isDemo, isSelfHosted, trans } from '$app/common/helpers';
import { useUnlockButtonForHosted } from '$app/common/hooks/useUnlockButtonForHosted';
import { useUnlockButtonForSelfHosted } from '$app/common/hooks/useUnlockButtonForSelfHosted';
import { useCurrentCompanyUser } from '$app/common/hooks/useCurrentCompanyUser';
import { useEnabled } from '$app/common/guards/guards/enabled';
import { Dropdown } from '$app/components/dropdown/Dropdown';
import { DropdownElement } from '$app/components/dropdown/DropdownElement';
import {
    saveBtnAtom,
    useNavigationTopRightElement,
} from '$app/components/layouts/common/hooks';
import { VerifyEmail } from '../banners/VerifyEmail';
import { ActivateCompany } from '../banners/ActivateCompany';
import { VerifyPhone } from '../banners/VerifyPhone';
import { useCurrentCompany } from '$app/common/hooks/useCurrentCompany';
import { useColorScheme } from '$app/common/colors';
import { Search } from '$app/pages/dashboard/components/Search';
import { useInjectUserChanges } from '$app/common/hooks/useInjectUserChanges';
import { useAtomValue } from 'jotai';
import { usePreventNavigation } from '$app/common/hooks/usePreventNavigation';
import { Notifications } from '../Notifications';
import { useSocketEvent } from '$app/common/queries/sockets';
import { Invoice } from '$app/common/interfaces/invoice';
import toast from 'react-hot-toast';
import { EInvoiceCredits } from '../banners/EInvoiceCredits';
import { LuMapPin } from 'react-icons/lu';

export interface SaveOption {
    label: string;
    onClick: (event: FormEvent<HTMLFormElement>) => unknown;
    icon?: ReactElement;
}

interface Props extends CommonProps {
    title?: string | null;
    onSaveClick?: any;
    onCancelClick?: any;
    breadcrumbs: Page[];
    topRight?: ReactNode;
    docsLink?: string;
    navigationTopRight?: ReactNode;
    saveButtonLabel?: string | null;
    disableSaveButton?: boolean;
    additionalSaveOptions?: SaveOption[];
    aboveMainContainer?: ReactNode;
    afterBreadcrumbs?: ReactNode;
}

export function Default(props: Props) {
    const [t] = useTranslation();

    const location = useLocation();
    const colors = useColorScheme();

    const enabled = useEnabled();
    const hasPermission = useHasPermission();
    const preventNavigation = usePreventNavigation();

    const user = useInjectUserChanges();
    const company = useCurrentCompany();
    const companyUser = useCurrentCompanyUser();

    const isMiniSidebar = Boolean(
        user?.company_user?.react_settings.show_mini_sidebar
    );
    const shouldShowUnlockButton =
        !isDemo() &&
        (useUnlockButtonForHosted() || useUnlockButtonForSelfHosted());

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

    // ==== Bagian navigation dengan FIBER OPTIK dropdown ====
    const navigation: NavigationItem[] = [
        {
            name: t('dashboard'),
            href: '/dashboard',
            icon: Home,
            current: location.pathname.startsWith('/dashboard'),
            visible: hasPermission('view_dashboard'),
        },
        {
            name: t('clients'),
            href: '/clients',
            icon: Users,
            current: location.pathname.startsWith('/clients'),
            visible:
                hasPermission('view_client') ||
                hasPermission('create_client') ||
                hasPermission('edit_client'),
            rightButton: {
                icon: PlusCircle,
                to: '/clients/create',
                label: t('new_client'),
                visible: hasPermission('create_client'),
            },
        },
        {
            name: t('products'),
            href: '/products',
            icon: Box,
            current: location.pathname.startsWith('/products'),
            visible:
                hasPermission('view_product') ||
                hasPermission('create_product') ||
                hasPermission('edit_product'),
            rightButton: {
                icon: PlusCircle,
                to: '/products/create',
                label: t('new_product'),
                visible: hasPermission('create_product'),
            },
        },
        {
            name: t('invoices'),
            href: '/invoices',
            icon: FileText,
            current: location.pathname.startsWith('/invoices'),
            visible:
                enabled(ModuleBitmask.Invoices) &&
                (hasPermission('view_invoice') ||
                    hasPermission('create_invoice') ||
                    hasPermission('edit_invoice')),
            rightButton: {
                icon: PlusCircle,
                to: '/invoices/create',
                label: t('new_invoice'),
                visible: hasPermission('create_invoice'),
            },
        },
        {
            name: t('recurring_invoices'),
            href: '/recurring_invoices',
            icon: Repeat,
            current: location.pathname.startsWith('/recurring_invoices'),
            visible:
                enabled(ModuleBitmask.RecurringInvoices) &&
                (hasPermission('view_recurring_invoice') ||
                    hasPermission('create_recurring_invoice') ||
                    hasPermission('edit_recurring_invoice')),
            rightButton: {
                icon: PlusCircle,
                to: '/recurring_invoices/create',
                label: t('new_recurring_invoice'),
                visible: hasPermission('create_recurring_invoice'),
            },
        },
        {
            name: t('payments'),
            href: '/payments',
            icon: CreditCard,
            current: location.pathname.startsWith('/payments'),
            visible:
                hasPermission('view_payment') ||
                hasPermission('create_payment') ||
                hasPermission('edit_payment'),
            rightButton: {
                icon: PlusCircle,
                to: '/payments/create',
                label: t('new_payment'),
                visible: hasPermission('create_payment'),
            },
        },
        {
            name: t('quotes'),
            href: '/quotes',
            icon: File,
            current: location.pathname.startsWith('/quotes'),
            visible:
                enabled(ModuleBitmask.Quotes) &&
                (hasPermission('view_quote') ||
                    hasPermission('create_quote') ||
                    hasPermission('edit_quote')),
            rightButton: {
                icon: PlusCircle,
                to: '/quotes/create',
                label: t('new_quote'),
                visible: hasPermission('create_quote'),
            },
        },
        {
            name: t('credits'),
            href: '/credits',
            icon: FileText,
            current: location.pathname.startsWith('/credits'),
            visible:
                enabled(ModuleBitmask.Credits) &&
                (hasPermission('view_credit') ||
                    hasPermission('create_credit') ||
                    hasPermission('edit_credit')),
            rightButton: {
                icon: PlusCircle,
                to: '/credits/create',
                label: t('new_credit'),
                visible: hasPermission('create_credit'),
            },
        },
        {
            name: t('projects'),
            href: '/projects',
            icon: Briefcase,
            current: location.pathname.startsWith('/projects'),
            visible:
                enabled(ModuleBitmask.Projects) &&
                (hasPermission('view_project') ||
                    hasPermission('create_project') ||
                    hasPermission('edit_project')),
            rightButton: {
                icon: PlusCircle,
                to: '/projects/create',
                label: t('new_project'),
                visible: hasPermission('create_project'),
            },
        },
        {
            name: t('tasks'),
            href: '/tasks',
            icon: Clock,
            current: location.pathname.startsWith('/tasks'),
            visible:
                enabled(ModuleBitmask.Tasks) &&
                (hasPermission('view_task') ||
                    hasPermission('edit_task') ||
                    hasPermission('create_task')),
            rightButton: {
                icon: PlusCircle,
                to: '/tasks/create',
                label: t('new_task'),
                visible: hasPermission('create_task'),
            },
        },
        {
            name: t('vendors'),
            href: '/vendors',
            icon: BiBuildings,
            current: location.pathname.startsWith('/vendors'),
            visible:
                enabled(ModuleBitmask.Vendors) &&
                (hasPermission('view_vendor') ||
                    hasPermission('create_vendor') ||
                    hasPermission('edit_vendor')),
            rightButton: {
                icon: PlusCircle,
                to: '/vendors/create',
                label: t('new_vendor'),
                visible: hasPermission('create_vendor'),
            },
        },
        {
            name: t('purchase_orders'),
            href: '/purchase_orders',
            icon: BiFile,
            current: location.pathname.startsWith('/purchase_orders'),
            visible:
                enabled(ModuleBitmask.PurchaseOrders) &&
                (hasPermission('view_purchase_order') ||
                    hasPermission('create_purchase_order') ||
                    hasPermission('edit_purchase_order')),
            rightButton: {
                icon: PlusCircle,
                to: '/purchase_orders/create',
                label: t('new_purchase_order'),
                visible: hasPermission('create_purchase_order'),
            },
        },
        {
            name: t('expenses'),
            href: '/expenses',
            icon: BiWallet,
            current: location.pathname.startsWith('/expenses'),
            visible:
                enabled(ModuleBitmask.Expenses) &&
                (hasPermission('view_expense') ||
                    hasPermission('create_expense') ||
                    hasPermission('edit_expense')),
            rightButton: {
                icon: PlusCircle,
                to: '/expenses/create',
                label: t('new_expense'),
                visible: hasPermission('create_expense'),
            },
        },
        {
            name: t('recurring_expenses'),
            href: '/recurring_expenses',
            icon: Repeat,
            current: location.pathname.startsWith('/recurring_expenses'),
            visible:
                enabled(ModuleBitmask.RecurringExpenses) &&
                (hasPermission('view_recurring_expense') ||
                    hasPermission('create_recurring_expense') ||
                    hasPermission('edit_recurring_expense')),
            rightButton: {
                icon: PlusCircle,
                to: '/recurring_expenses/create',
                label: t('new_recurring_expense'),
                visible: hasPermission('create_recurring_expense'),
            },
        },
        {
            name: t('Mapping'),
            href: '/mapping',
            icon: LuMapPin,
            current: location.pathname.startsWith('/mapping'),
            visible:
                enabled(ModuleBitmask.Vendors) &&
                (hasPermission('view_vendor') ||
                    hasPermission('create_vendor') ||
                    hasPermission('edit_vendor')),
            rightButton: {
                icon: PlusCircle,
                to: '/vendors/create',
                label: t('new_vendor'),
                visible: hasPermission('create_vendor'),
            },
        },
        {
            name: t('WA Gateway'),
            href: '/wa-gateway',
            icon: BiLogoWhatsapp,
            current: location.pathname.startsWith('/wa-gateway'),
            visible:
                enabled(ModuleBitmask.RecurringExpenses) &&
                hasPermission('view_wa_gateway'),
        },

        // ===== DI SINI DITAMBAHKAN PARENT “FIBER OPTIK” dengan dua children =====
        {
            name: t('FIBER OPTIK'),
            href: '', // kosong karena hanya toggle
            icon: Radio,
            current:
                location.pathname.startsWith('/fo-lokasis') ||
                location.pathname.startsWith('/fo-odc') ||
                location.pathname.startsWith('/fo-kabel-odcs') ||
                location.pathname.startsWith('/fo-kabel-tube-odcs') ||
                location.pathname.startsWith('/fo-kabel-core-odcs') ||
                location.pathname.startsWith('/fo-odps') ||
                location.pathname.startsWith('/fo-client-ftths') ||
                location.pathname.startsWith('/fo-reports'),
            visible:
                hasPermission('view_product') ||
                hasPermission('create_product') ||
                hasPermission('edit_product'),
            children: [
                {
                    name: t('Lokasi'),
                    href: '/fo-lokasis',
                    icon: Radio,
                    current: location.pathname.startsWith('/fo-lokasis'),
                    visible:
                        hasPermission('view_product') ||
                        hasPermission('create_product') ||
                        hasPermission('edit_product'),
                    rightButton: {
                        icon: PlusCircle,
                        to: '/fo-lokasis/create',
                        label: t('new_fo_lokasi'),
                        visible: hasPermission('create_product'),
                    },
                },
                {
                    name: t('ODC'),
                    href: '/fo-odcs',
                    icon: Radio,
                    current: location.pathname.startsWith('/fo-odcs'),
                    visible:
                        hasPermission('view_product') ||
                        hasPermission('create_product') ||
                        hasPermission('edit_product'),
                    rightButton: {
                        icon: PlusCircle,
                        to: '/fo-odcs/create',
                        label: t('new_fo_odc'),
                        visible: hasPermission('create_product'),
                    },
                },
                {
                    name: t('KABEL'),
                    href: '', // kosong karena hanya toggle
                    icon: Radio,
                    current:
                        location.pathname.startsWith('/fo-kabel-odcs') ||
                        location.pathname.startsWith('/fo-kabel-tube-odcs') ||
                        location.pathname.startsWith('/fo-kabel-core-odcs'),
                    visible:
                        hasPermission('view_product') ||
                        hasPermission('create_product') ||
                        hasPermission('edit_product'),
                    children: [
                        {
                            name: t('Kabel ODC'),
                            href: '/fo-kabel-odcs',
                            icon: Radio,
                            current:
                                location.pathname.startsWith('/fo-kabel-odcs'),
                            visible:
                                hasPermission('view_product') ||
                                hasPermission('create_product') ||
                                hasPermission('edit_product'),
                            rightButton: {
                                icon: PlusCircle,
                                to: '/fo-kabel-odcs/create',
                                label: t('new_product'),
                                visible: hasPermission('create_product'),
                            },
                        },
                        {
                            name: t('Tube Kabel ODC'),
                            href: '/fo-kabel-tube-odcs',
                            icon: Radio,
                            current: location.pathname.startsWith(
                                '/fo-kabel-tube-odcs'
                            ),
                            visible:
                                hasPermission('view_product') ||
                                hasPermission('create_product') ||
                                hasPermission('edit_product'),
                            rightButton: {
                                icon: PlusCircle,
                                to: '/fo-odc/create',
                                label: t('new_product'),
                                visible: hasPermission('create_product'),
                            },
                        },
                        {
                            name: t('Core Kabel ODC'),
                            href: '/fo-kabel-core-odcs',
                            icon: Radio,
                            current: location.pathname.startsWith(
                                '/fo-kabel-core-odcs'
                            ),
                            visible:
                                hasPermission('view_product') ||
                                hasPermission('create_product') ||
                                hasPermission('edit_product'),
                            rightButton: {
                                icon: PlusCircle,
                                to: '/fo-kabel-core-odcs/create',
                                label: t('new_product'),
                                visible: hasPermission('create_product'),
                            },
                        },
                    ],
                },
                {
                    name: t('ODP'),
                    href: '/fo-odps',
                    icon: Radio,
                    current: location.pathname.startsWith('/fo-odps'),
                    visible:
                        hasPermission('view_product') ||
                        hasPermission('create_product') ||
                        hasPermission('edit_product'),
                    rightButton: {
                        icon: PlusCircle,
                        to: '/fo-odps/create',
                        label: t('new_product'),
                        visible: hasPermission('create_product'),
                    },
                },
                {
                    name: t('Client FTTH'),
                    href: '/fo-client-ftths',
                    icon: Radio,
                    current: location.pathname.startsWith('/fo-client-ftths'),
                    visible:
                        hasPermission('view_product') ||
                        hasPermission('create_product') ||
                        hasPermission('edit_product'),
                    rightButton: {
                        icon: PlusCircle,
                        to: '/fo-client-ftths/create',
                        label: t('new_product'),
                        visible: hasPermission('create_product'),
                    },
                },
                {
                    name: t('FTTH Reports'),
                    href: '/fo-reports',
                    icon: PieChart,
                    current: location.pathname.startsWith('/fo-reports'),
                    visible: hasPermission('view_reports'),
                },
            ],
        },
        // =======================================================================

        {
            name: t('reports'),
            href: '/reports',
            icon: PieChart,
            current: location.pathname.startsWith('/reports'),
            visible: hasPermission('view_reports'),
        },
        {
            name: t('transactions'),
            href: '/transactions',
            icon: AiOutlineBank,
            current: location.pathname.startsWith('/transactions'),
            visible:
                enabled(ModuleBitmask.Transactions) &&
                (hasPermission('view_bank_transaction') ||
                    hasPermission('create_bank_transaction') ||
                    hasPermission('edit_bank_transaction')),
            rightButton: {
                icon: PlusCircle,
                to: '/transactions/create',
                label: t('new_transaction'),
                visible: hasPermission('create_bank_transaction'),
            },
        },
        {
            name: t('settings'),
            href:
                companyUser?.is_admin || companyUser?.is_owner
                    ? '/settings/company_details'
                    : '/settings/user_details',
            icon: Settings,
            current: location.pathname.startsWith('/settings'),
            visible: Boolean(company),
        },
    ];

    const saveBtn = useAtomValue(saveBtnAtom);
    const navigationTopRightElement = useNavigationTopRightElement();

    useSocketEvent<Invoice>({
        on: ['App\\Events\\Invoice\\InvoiceWasViewed'],
        callback: ({ data }) => {
            if (
                !companyUser?.notifications.email.includes('invoice_viewed') ||
                !companyUser?.notifications.email.includes(
                    'invoice_viewed_user'
                )
            ) {
                return;
            }

            toast(
                <div className="flex flex-col gap-2">
                    <span className="flex items-center gap-1">
                        <Info size={18} />
                        <span>
                            {trans('notification_invoice_viewed_subject', {
                                invoice: data.number,
                                client: data.client?.display_name,
                            })}
                            .
                        </span>
                    </span>

                    <div className="flex justify-center">
                        <Link to={`/invoices/${data.id}/edit`}>
                            {t('view_invoice')}
                        </Link>
                    </div>
                </div>,
                {
                    duration: 8000,
                    position: 'top-center',
                }
            );
        },
    });

    return (
        <div>
            <ActivateCompany />
            <VerifyEmail />
            <VerifyPhone />
            <EInvoiceCredits />

            <MobileSidebar
                navigation={navigation}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <DesktopSidebar navigation={navigation} docsLink={props.docsLink} />

            <div
                className={`${
                    isMiniSidebar ? 'md:pl-16' : 'md:pl-64'
                } flex flex-col flex-1`}
            >
                <div
                    style={{
                        backgroundColor: colors.$1,
                        borderColor: colors.$4,
                    }}
                    className="sticky top-0 z-10 flex flex-shrink-0 h-16 border-b shadow"
                >
                    <button
                        type="button"
                        className="px-4 border-r border-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <MenuIcon className="dark:text-gray-100" />
                    </button>
                    <div
                        className="flex items-center flex-1 px-4 xl:px-8"
                        data-cy="topNavbar"
                    >
                        <div className="flex items-center flex-1 space-x-4">
                            <h2
                                style={{ color: colors.$3 }}
                                className="text-sm md:text-lg whitespace-nowrap"
                            >
                                {props.title}
                            </h2>

                            <QuickCreatePopover />
                            <Search />
                        </div>

                        <div className="flex items-center ml-4 space-x-2 md:ml-6 lg:space-x-3">
                            <Notifications />

                            {shouldShowUnlockButton && (
                                <button
                                    className="items-center justify-center hidden px-4 py-2 text-sm text-white bg-green-500 rounded sm:inline-flex hover:bg-green-600"
                                    onClick={() =>
                                        preventNavigation({
                                            url: isSelfHosted()
                                                ? import.meta.env
                                                      .VITE_WHITELABEL_INVOICE_URL ||
                                                  'https://invoiceninja.invoicing.co/client/subscriptions/O5xe7Rwd7r/purchase'
                                                : (user?.company_user
                                                      ?.ninja_portal_url as string),
                                            externalLink: true,
                                        })
                                    }
                                >
                                    <span>
                                        {isSelfHosted()
                                            ? t('white_label_button')
                                            : t('unlock_pro')}
                                    </span>
                                </button>
                            )}

                            {props.onCancelClick && (
                                <Button
                                    onClick={props.onCancelClick}
                                    type="secondary"
                                >
                                    {t('cancel')}
                                </Button>
                            )}

                            {(Boolean(props.onSaveClick) || saveBtn) && (
                                <div>
                                    {!props.additionalSaveOptions && (
                                        <Button
                                            onClick={
                                                saveBtn?.onClick ||
                                                props.onSaveClick
                                            }
                                            disabled={
                                                saveBtn?.disableSaveButton ||
                                                props.disableSaveButton
                                            }
                                            disableWithoutIcon
                                        >
                                            {(saveBtn?.label ||
                                                props.saveButtonLabel) ??
                                                t('save')}
                                        </Button>
                                    )}

                                    {props.additionalSaveOptions && (
                                        <div className="flex">
                                            <Button
                                                className="px-3 rounded-tr-none rounded-br-none"
                                                onClick={
                                                    saveBtn?.onClick ||
                                                    props.onSaveClick
                                                }
                                                disabled={
                                                    saveBtn?.disableSaveButton ||
                                                    props.disableSaveButton
                                                }
                                                disableWithoutIcon
                                            >
                                                {(saveBtn?.label ||
                                                    props.saveButtonLabel) ??
                                                    t('save')}
                                            </Button>

                                            <Dropdown
                                                className="h-full px-1 border-r-0 border-gray-200 rounded-tl-none rounded-bl-none border-l-1 border-y-0"
                                                cardActions
                                                disabled={
                                                    saveBtn?.disableSaveButton ||
                                                    props.disableSaveButton
                                                }
                                            >
                                                {props.additionalSaveOptions.map(
                                                    (option, index) => (
                                                        <DropdownElement
                                                            key={index}
                                                            icon={option.icon}
                                                            disabled={
                                                                props.disableSaveButton
                                                            }
                                                            onClick={
                                                                option.onClick
                                                            }
                                                        >
                                                            {option.label}
                                                        </DropdownElement>
                                                    )
                                                )}
                                            </Dropdown>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(navigationTopRightElement ||
                                props.navigationTopRight) && (
                                <div className="flex items-center space-x-3">
                                    {navigationTopRightElement?.element ||
                                        props.navigationTopRight}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {props.aboveMainContainer}

                <main className="flex-1">
                    {(props.breadcrumbs ||
                        props.topRight ||
                        props.afterBreadcrumbs) &&
                        props.breadcrumbs.length > 0 && (
                            <div className="flex flex-col px-4 pt-4 space-y-4 md:px-8 md:pt-8 dark:text-gray-100 lg:flex-row lg:justify-between lg:items-center lg:space-y-0">
                                <div className="flex items-center">
                                    {props.breadcrumbs && (
                                        <Breadcrumbs
                                            pages={props.breadcrumbs}
                                        />
                                    )}

                                    {props.afterBreadcrumbs}
                                </div>

                                {props.topRight && <div>{props.topRight}</div>}
                            </div>
                        )}

                    <div
                        style={{ color: colors.$3, backgroundColor: colors.$2 }}
                        className="p-4 md:py-8 xl:p-8 dark:text-gray-100"
                    >
                        {props.children}
                    </div>
                </main>
            </div>
        </div>
    );
}
