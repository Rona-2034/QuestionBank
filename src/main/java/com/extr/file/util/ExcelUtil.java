package com.extr.file.util;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.apache.poi.hssf.usermodel.HSSFCell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.hssf.usermodel.HSSFRow;
import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

public class ExcelUtil {

	public static Log log = LogFactory.getLog(ExcelUtil.class);
	
	public static List<Map<String,String>> ExcelToList(String filePath) throws Exception{
		return ExcelToList(filePath, 1);
	}

	public static List<String> readTitleList(String filePath) throws Exception{
		List<String> titleList = new ArrayList<String>();
		String filetype = filePath.substring(filePath.lastIndexOf(".") + 1);
		FileInputStream fi = null;
		try {
			fi = new FileInputStream(filePath);
		} catch (FileNotFoundException e1) {
			e1.printStackTrace();
		}
		if(fi == null)
			throw new Exception("文件不存在");
		try{
			if("xls".equals(filetype.toLowerCase())){
				HSSFWorkbook wookbook = new HSSFWorkbook(fi);
				HSSFSheet sheet = wookbook.getSheet("Sheet1");
				HSSFRow title = sheet.getRow(0);
				if(title != null){
					int cells = title.getPhysicalNumberOfCells();
					for (int j = 0; j < cells; j++){
						HSSFCell cell = title.getCell(j);
						titleList.add(cell == null ? "" : cell.getStringCellValue().trim());
					}
				}
			}else if("xlsx".equals(filetype.toLowerCase())){
				XSSFWorkbook wookbook = new XSSFWorkbook(fi);
				XSSFSheet sheet = wookbook.getSheet("Sheet1");
				XSSFRow title = sheet.getRow(0);
				if(title != null){
					int cells = title.getPhysicalNumberOfCells();
					for (int j = 0; j < cells; j++){
						XSSFCell cell = title.getCell(j);
						titleList.add(cell == null ? "" : cell.getStringCellValue().trim());
					}
				}
			}
		} finally{
			fi.close();
		}
		return titleList;
	}
	
	public static List<Map<String,String>> ExcelToList(String filePath, int firstDataRowIndex) throws Exception{
		
		List<Map<String,String>> mapList = new ArrayList<Map<String,String>>();
		String filetype = filePath.substring(filePath.lastIndexOf(".") + 1);
		FileInputStream fi = null;
		try {
			fi = new FileInputStream(filePath);
		} catch (FileNotFoundException e1) {
			// TODO Auto-generated catch block
			e1.printStackTrace();
		}
		if(fi == null)
			throw new Exception("文件不存在");
		//xls文件
		if("xls".equals(filetype.toLowerCase())){
			try {
				HSSFWorkbook wookbook = new HSSFWorkbook(fi);
				HSSFSheet sheet = wookbook.getSheet("Sheet1");
				int rows = sheet.getPhysicalNumberOfRows();
				
				//获取标题行
				HSSFRow title = sheet.getRow(0);
				log.info(title.getLastCellNum());
					int index = title.getFirstCellNum();
					int rowcount = title.getLastCellNum();
					for (int i = firstDataRowIndex; i < rows; i++){
						
						HSSFRow row = sheet.getRow(i);
					if(isBlankRow(row, index, rowcount))
						continue;
					if (row != null){
						Map<String,String> map = new TreeMap<String,String>();
						int cells = title.getPhysicalNumberOfCells();
						
						for (int j = 0; j < cells; j++){
							String value = "";
							HSSFCell cell = row.getCell(j);
							if (cell != null){
								switch (cell.getCellType()){
									case FORMULA:
										break;
									case NUMERIC:
										cell.setCellType(CellType.STRING);
										value += cell.getStringCellValue().trim();
										break;
									case STRING:
										value += cell.getStringCellValue().trim();
										break;
									default:
										value = "";
										break;
								}
							}
							//String key = title.getCell(j).getStringCellValue().trim();
							map.put(title.getCell(j).getStringCellValue().trim(), value);
						}
						
						mapList.add(map);
					}
				}
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch(Exception e){
				e.printStackTrace();
			}
		}else if("xlsx".equals(filetype.toLowerCase())){
			//xlsx文件
			try {
				XSSFWorkbook wookbook = new XSSFWorkbook(new FileInputStream(filePath));
				XSSFSheet sheet = wookbook.getSheet("Sheet1");
				int rows = sheet.getPhysicalNumberOfRows();
				//获取标题行
				XSSFRow title = sheet.getRow(0);
					int index = title.getFirstCellNum();
					int rowcount = title.getLastCellNum();
					for (int i = firstDataRowIndex; i < rows; i++){
						
						XSSFRow row = sheet.getRow(i);
					if(isBlankRow(row, index, rowcount))
						continue;
					if (row != null){
						Map<String,String> map = new TreeMap<String,String>();
						int cells = title.getPhysicalNumberOfCells();
						
						for (int j = 0; j < cells; j++){
							String value = "";
							XSSFCell cell = row.getCell(j);
							if (cell != null){
								switch (cell.getCellType()){
									case FORMULA:
										break;
									case NUMERIC:
										cell.setCellType(CellType.STRING);
										value += cell.getStringCellValue().trim();
										break;
									case STRING:
										value += cell.getStringCellValue().trim();
										break;
									default:
										value = "";
										break;
								}
							}
							map.put(title.getCell(j).getStringCellValue().trim(), value);
						}
						
						mapList.add(map);
					}
				}
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		if(fi != null)
			fi.close();
		
		return mapList;
	}
	
	public static boolean isBlankRow(HSSFRow row, int index, int rowCount){
		if(row == null)
			return true;
		for(int i=index; i < rowCount; i++){
			if(row.getCell(i) != null && 
					!"".equals(row.getCell(i).getStringCellValue().trim())){
				return false;
			}
		}
		return true;
	}
	
	public static boolean isBlankRow(XSSFRow row, int index, int rowCount){
		if(row == null)
			return true;
		for(int i=index; i < rowCount; i++){
			if(row.getCell(i) != null && 
					!"".equals(row.getCell(i).toString().trim())){
				return false;
			}
		}
		return true;
	}
}
