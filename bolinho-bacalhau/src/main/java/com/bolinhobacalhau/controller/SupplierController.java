package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.Supplier;
import com.bolinhobacalhau.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/fornecedores") @RequiredArgsConstructor
@Tag(name = "Fornecedores")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping         public List<Supplier> listActive()   { return supplierRepository.findByActiveTrue(); }
    @GetMapping("/todos") public List<Supplier> listAll()    { return supplierRepository.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<Supplier> findById(@PathVariable Long id) {
        return supplierRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Supplier> create(@RequestBody Supplier supplier) {
        supplier.setActive(true);
        return ResponseEntity.status(201).body(supplierRepository.save(supplier));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Supplier> update(@PathVariable Long id, @RequestBody Supplier body) {
        Supplier s = supplierRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Fornecedor não encontrado"));
        s.setName(body.getName()); s.setCnpjCpf(body.getCnpjCpf());
        s.setContactName(body.getContactName()); s.setPhone(body.getPhone());
        s.setEmail(body.getEmail()); s.setAddress(body.getAddress()); s.setNotes(body.getNotes());
        return ResponseEntity.ok(supplierRepository.save(s));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        supplierRepository.findById(id).ifPresent(s -> { s.setActive(false); supplierRepository.save(s); });
        return ResponseEntity.noContent().build();
    }
}
