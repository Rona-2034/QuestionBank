package com.extr.file;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UploadStorageService {

    private final Path root;

    public UploadStorageService(@Value("${examxx.upload-dir}") String uploadDirectory) {
        this.root = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public String storeImportFile(MultipartFile file, String username) throws IOException {
        String fileName = safeFileName(file.getOriginalFilename());
        Path destination = userDirectory(username).resolve("tmp").resolve(fileName);
        return store(file, destination).toString();
    }

    public String storeQuestionImage(MultipartFile file, String username) throws IOException {
        String fileName = safeFileName(file.getOriginalFilename());
        String extension = extension(fileName);
        if (!".jpg".equals(extension) && !".jpeg".equals(extension) && !".png".equals(extension)) {
            throw new IllegalArgumentException("仅支持 JPG、JPEG 或 PNG 图片");
        }
        Path relative = Path.of("question", safePathSegment(username), Instant.now().toEpochMilli() + extension);
        store(file, root.resolve(relative));
        return "/files/" + relative.toString().replace('\\', '/');
    }

    private Path store(MultipartFile file, Path destination) throws IOException {
        Files.createDirectories(destination.getParent());
        try (var input = file.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        }
        return destination;
    }

    private Path userDirectory(String username) {
        return root.resolve("question").resolve(safePathSegment(username));
    }

    private String safeFileName(String originalFileName) {
        String fileName = originalFileName == null ? "upload" : Path.of(originalFileName).getFileName().toString();
        if (fileName.isBlank()) {
            throw new IllegalArgumentException("文件名不能为空");
        }
        return fileName;
    }

    private String safePathSegment(String value) {
        return value == null || value.isBlank() ? "anonymous" : value.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String extension(String fileName) {
        int index = fileName.lastIndexOf('.');
        return index < 0 ? "" : fileName.substring(index).toLowerCase(Locale.ROOT);
    }
}
