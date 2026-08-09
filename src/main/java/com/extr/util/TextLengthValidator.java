package com.extr.util;

public class TextLengthValidator {

	private static final int MIN_LENGTH = 1;
	private static final int MAX_LENGTH = 40;

	private TextLengthValidator() {
	}

	public static boolean isRequiredTextValid(String value) {
		if (value == null) {
			return false;
		}
		int length = value.trim().length();
		return length >= MIN_LENGTH && length <= MAX_LENGTH;
	}

	public static boolean isOptionalTextValid(String value) {
		if (value == null || value.trim().length() == 0) {
			return true;
		}
		return value.trim().length() <= MAX_LENGTH;
	}

	public static String message(String fieldName) {
		return fieldName + "请保持在1-40个字符以内";
	}
}
