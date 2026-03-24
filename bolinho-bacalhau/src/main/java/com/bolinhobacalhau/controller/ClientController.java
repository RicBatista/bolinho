package com.bolinhobacalhau.controller;

import com.bolinhobacalhau.entity.Client;
import com.bolinhobacalhau.repository.ClientRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clientes")
@RequiredArgsConstructor
@Tag(name = "Clientes")
public class ClientController {

    private final ClientRepository clientRepository;

    @GetMapping
    public List<Client> listActive() {
        return clientRepository.findByActiveTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Client> findById(@PathVariable Long id) {
        return clientRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Client> create(@Valid @RequestBody Client body) {
        body.setActive(true);
        return ResponseEntity.status(201).body(clientRepository.save(body));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Client> update(@PathVariable Long id, @Valid @RequestBody Client body) {
        Client c = clientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cliente não encontrado"));

        c.setName(body.getName());
        c.setPhone(body.getPhone());
        c.setCpf(body.getCpf());
        c.setAddress(body.getAddress());
        c.setNotes(body.getNotes());

        return ResponseEntity.ok(clientRepository.save(c));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(@PathVariable Long id) {
        clientRepository.findById(id).ifPresent(c -> {
            c.setActive(false);
            clientRepository.save(c);
        });
        return ResponseEntity.noContent().build();
    }
}

