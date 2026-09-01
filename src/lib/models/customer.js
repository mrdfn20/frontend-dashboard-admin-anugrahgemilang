// src/lib/models/customer.js

/**
 * Customer Data Model dan Validation
 */

/**
 * Default customer object structure
 */
export const defaultCustomer = {
	id: null,
	title: '',
	customer_name: '',
	date_of_birth: null,
	address: '',
	whatsapp_number: '',
	customer_gallon_stock: 0,
	gallon_price_id: '',
	subscription_date: new Date().toISOString().slice(0, 10),
	customer_photo: null,
	sub_region_id: null,
	customer_type_id: 1,
	latitude: null,
	longitude: null
};

/**
 * Customer validation rules
 */
export const customerValidation = {
	title: {
		required: true,
		maxLength: 10,
		message: 'Title wajib diisi dan maksimal 10 karakter'
	},
	customer_name: {
		required: true,
		maxLength: 255,
		message: 'Nama customer wajib diisi dan maksimal 255 karakter'
	},
	address: {
		required: true,
		maxLength: 500,
		message: 'Alamat wajib diisi dan maksimal 500 karakter'
	},
	gallon_price_id: {
		required: true,
		message: 'Harga galon wajib dipilih'
	},
	customer_type_id: {
		required: true,
		message: 'Tipe customer wajib dipilih'
	}
};

/**
 * Validate customer data
 * @param {Object} customer - Customer data to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateCustomer(customer) {
	const errors = {};
	let isValid = true;

	// Check required fields
	Object.keys(customerValidation).forEach((field) => {
		const rule = customerValidation[field];
		const value = customer[field];

		if (rule.required && (!value || String(value).trim() === '')) {
			errors[field] = rule.message;
			isValid = false;
		}

		if (rule.maxLength && value && String(value).length > rule.maxLength) {
			errors[field] = rule.message;
			isValid = false;
		}
	});

	// Additional validations
	if (customer.whatsapp_number && !/^[0-9+\-\s()]+$/.test(customer.whatsapp_number)) {
		errors.whatsapp_number = 'Format nomor WhatsApp tidak valid';
		isValid = false;
	}

	if (customer.date_of_birth && new Date(customer.date_of_birth) > new Date()) {
		errors.date_of_birth = 'Tanggal lahir tidak boleh di masa depan';
		isValid = false;
	}

	return { isValid, errors };
}

/**
 * Format customer data for display
 * @param {Object} customer - Raw customer data
 * @returns {Object} Formatted customer data
 */
export function formatCustomerForDisplay(customer) {
	return {
		...customer,
		display_name: `${customer.title} ${customer.customer_name}`,
		formatted_phone: formatPhone(customer.whatsapp_number),
		formatted_gallon_price: formatGallonPrice(customer.price),
		customer_avatar: getCustomerAvatar(customer),
		customer_initial: getCustomerInitial(customer),
		subscription_date_formatted: customer.subscription_date
			? new Date(customer.subscription_date).toLocaleDateString('id-ID')
			: '',
		date_of_birth_formatted: customer.date_of_birth
			? new Date(customer.date_of_birth).toLocaleDateString('id-ID')
			: ''
	};
}

/**
 * Clean customer data before sending to API
 * @param {Object} customer - Customer data
 * @returns {Object} Cleaned customer data
 */
export function cleanCustomerData(customer) {
	const cleaned = { ...customer };

	// Remove id field for create operation
	delete cleaned.id;

	// Remove empty strings and convert to null
	Object.keys(cleaned).forEach((key) => {
		if (cleaned[key] === '') {
			cleaned[key] = null;
		}
	});

	// Convert string numbers to actual numbers
	if (cleaned.customer_gallon_stock) {
		cleaned.customer_gallon_stock = parseInt(cleaned.customer_gallon_stock);
	}
	if (cleaned.customer_type_id) {
		cleaned.customer_type_id = parseInt(cleaned.customer_type_id);
	}
	if (cleaned.sub_region_id) {
		cleaned.sub_region_id = parseInt(cleaned.sub_region_id);
	}

	// Convert coordinate strings to numbers if they exist
	if (cleaned.latitude) {
		cleaned.latitude = parseFloat(cleaned.latitude);
	}
	if (cleaned.longitude) {
		cleaned.longitude = parseFloat(cleaned.longitude);
	}

	return cleaned;
}

// ====== NEW FORMATTING FUNCTIONS ======

/**
 * Format phone number with dashes
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number
 */
export function formatPhone(phone) {
	if (!phone) return '-';
	return phone.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

/**
 * Format gallon price to "K" format
 * @param {number|string} price - Raw price
 * @returns {string} Formatted price
 */
export function formatGallonPrice(price) {
	if (!price) return '-';
	const numPrice = parseFloat(price);
	if (numPrice >= 1000) {
		return `${numPrice / 1000}K`;
	}
	return `${numPrice}`;
}

/**
 * Get customer avatar URL with Google Drive transformation
 * @param {Object} customer - Customer object
 * @returns {string|null} Avatar URL or null
 */
export function getCustomerAvatar(customer) {
	if (customer.customer_photo) {
		// Transform Google Drive link to direct image URL
		const driveLink = customer.customer_photo;

		// Extract file ID from Google Drive URL
		const fileIdMatch = driveLink.match(/[?&]id=([a-zA-Z0-9_-]+)/);
		if (fileIdMatch) {
			const fileId = fileIdMatch[1];
			return `https://lh3.googleusercontent.com/d/${fileId}`;
		}

		// Fallback to original link if extraction fails
		return driveLink;
	}
	return null;
}

/**
 * Get customer initial for fallback avatar
 * @param {Object} customer - Customer object
 * @returns {string} Customer initial
 */
export function getCustomerInitial(customer) {
	return customer.customer_name ? customer.customer_name.charAt(0).toUpperCase() : 'N';
}

/**
 * Format sub region display
 * @param {Object} customer - Customer with region data
 * @returns {Object} Formatted region info
 */
export function formatSubRegion(customer) {
	return {
		main: customer.sub_region_name || '-',
		secondary: customer.region_name || ''
	};
}

/**
 * Get customer type label
 * @param {number} typeId - Customer type ID
 * @returns {string} Customer type label
 */
export function getCustomerTypeLabel(typeId) {
	const types = {
		1: 'Pelanggan Akhir (Rumah)',
		2: 'Warung/Distributor',
		3: 'Pabrik'
	};
	return types[typeId] || 'Unknown';
}
