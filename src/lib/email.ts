import {
  sendOrderConfirmationEmail as sendOrderConfirmationEmail_server,
  sendNewOrderNotification as sendNewOrderNotification_server,
  sendStripeActionRequiredEmail as sendStripeActionRequiredEmail_server,
  sendRefundStatusUpdateEmail as sendRefundStatusUpdateEmail_server,
  sendNewRefundRequestNotification as sendNewRefundRequestNotification_server,
  sendDisputeCreatedVendorNotification as sendDisputeCreatedVendorNotification_server,
  sendDisputeCreatedBuyerNotification as sendDisputeCreatedBuyerNotification_server,
  sendDisputeClosedNotification as sendDisputeClosedNotification_server,
} from './email-server'
import type { Order, Vendor, RefundRequest, Dispute } from './types'

export async function sendOrderConfirmationEmail(
  order: Order,
  vendor: Vendor,
  customerEmail: string
) {
  return await sendOrderConfirmationEmail_server(order, vendor, customerEmail)
}

export async function sendNewOrderNotification(order: Order, vendor: Vendor) {
  return await sendNewOrderNotification_server(order, vendor)
}

export async function sendStripeActionRequiredEmail(
  vendor: Vendor,
  message: string
) {
  return await sendStripeActionRequiredEmail_server(vendor, message)
}

export async function sendRefundStatusUpdateEmail(
  customerEmail: string,
  order: Order,
  request: RefundRequest,
  vendor: Vendor
) {
  return await sendRefundStatusUpdateEmail_server(
    customerEmail,
    order,
    request,
    vendor
  )
}

export async function sendNewRefundRequestNotification(
  vendor: Vendor,
  order: Order,
  request: RefundRequest
) {
  return await sendNewRefundRequestNotification_server(vendor, order, request)
}

export async function sendDisputeCreatedVendorNotification(
  vendor: Vendor,
  order: Order,
  dispute: Dispute
) {
  return await sendDisputeCreatedVendorNotification_server(vendor, order, dispute)
}

export async function sendDisputeCreatedBuyerNotification(
  customerEmail: string,
  order: Order,
  dispute: Dispute
) {
  return await sendDisputeCreatedBuyerNotification_server(
    customerEmail,
    order,
    dispute
  )
}

export async function sendDisputeClosedNotification(
  vendor: Vendor,
  customerEmail: string,
  order: Order,
  dispute: Dispute
) {
  return await sendDisputeClosedNotification_server(
    vendor,
    customerEmail,
    order,
    dispute
  )
}