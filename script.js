const switchMode = () => {
    if (document.body.classList.contains("light")) {
      document.body.classList.remove("light");
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
      document.body.classList.add("light");
    }
}

input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const value = document.getElementById('search').value.trim()
        detailNameFetch(value)
    }
});


document.querySelectorAll('.submenu .menuButt').forEach((button, index) => {
    if (index > 0) { 
        button.addEventListener('click', () => {
            const region = button.textContent.split('. ')[1]
            fetchRegion(region)
        })
    }
})

const pokemonContainer = document.getElementById('pokemonDiv')
const modal = document.getElementById('modal')
const modalDetail = document.getElementById('modalDetail')
const closeModal = document.querySelector('.close')
const paginationDiv = document.getElementById('pagination')
const pageInfo = document.getElementById('pageInfo')
const prev5Btn = document.getElementById('prev5Btn')
const prevBtn = document.getElementById('prevBtn')
const nextBtn = document.getElementById('nextBtn')
const next5Btn = document.getElementById('next5Btn')
const allPagesBtn = document.getElementById('allPagesBtn')
const movesBtn = document.getElementById('movesBtn')
const itemsBtn = document.getElementById('itemsBtn')
const pokemonBtn = document.getElementById('pokemonBtn')
const teamBtn = document.getElementById('teamBtn')
const teamModal = document.getElementById('teamModal')
const teamSlotsDiv = document.getElementById('teamSlots')
const teamDetailsDiv = document.getElementById('teamDetails')

const pageSize = 25
let currentMode = 'all'
let currentPage = 1
let totalPages = 1
let currentList = []
let currentFilter = 'All'
let currentDetailPokemon = null
let team = [null, null, null, null, null, null]

const regionMap = {
    'Kanto': 1,
    'Johto': 2,
    'Hoenn': 3,
    'Sinnoh': 4,
    'Unova': 5,
    'Kalos': 6,
    'Alola': 7,
    'Galar': 8,
    'Paldea': 9
}

function updatePaginationButtons() {
    const detailOpen = modal.style.display === 'block' || teamModal.style.display === 'block'
    paginationDiv.style.display = detailOpen ? 'none' : 'flex'
    prev5Btn.disabled = currentPage <= 1
    prevBtn.disabled = currentPage <= 1
    nextBtn.disabled = currentPage >= totalPages
    next5Btn.disabled = currentPage >= totalPages
    allPagesBtn.disabled = currentPage >= totalPages
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`
}

function clampPage(page) {
    return Math.min(Math.max(page, 1), totalPages)
}

async function loadAll(page = 1) {
    currentMode = 'all'
    currentFilter = 'All'
    currentPage = clampPage(page)

    try {
        const offset = (currentPage - 1) * pageSize
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${pageSize}&offset=${offset}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch All')
        const data = await response.json()

        totalPages = Math.ceil(data.count / pageSize)
        currentPage = clampPage(currentPage)
        currentList = data.results

        pokemonContainer.innerHTML = ''
        for (const pokemon of currentList) {
            const id = pokemon.url.split('/')[6]
            const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
            const detail = await detailResponse.json()
            const types = detail.types.map(t => t.type.name).join(', ')
            const image = detail.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            pokemonContainer.innerHTML += `
            <div onclick="detailFetch('${id}')" class="pokemonCard">
                <img src="${image}" class="imgCard" alt="${pokemon.name}">
                <h3>${pokemon.name}</h3>
                <p><strong>ID: </strong>${id}</p>
                <p><strong>Types: </strong>${types}</p>
                <p><strong>Generation: </strong>All</p>
            </div>`
        }
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }

    updatePaginationButtons()
}

async function loadListPage(page = 1) {
    currentPage = clampPage(page)
    pokemonContainer.innerHTML = ''
    const start = (currentPage - 1) * pageSize
    const entries = currentList.slice(start, start + pageSize)

    for (const entry of entries) {
        try {
            const pokemonRef = entry.pokemon ? entry.pokemon : entry
            const id = pokemonRef.url.split('/')[6]
            const detailResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
            if (!detailResponse.ok) throw new Error('Failed to fetch Pokemon details')
            const detail = await detailResponse.json()
            const types = detail.types.map(t => t.type.name).join(', ')
            const image = detail.sprites.front_default || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            pokemonContainer.innerHTML += `
                <div onclick="detailFetch('${id}')" class="pokemonCard">
                    <img src="${image}" class="imgCard" alt="${pokemonRef.name}">
                    <h3>${pokemonRef.name}</h3>
                    <p><strong>ID: </strong>${id}</p>
                    <p><strong>Types: </strong>${types}</p>
                    <p><strong>Generation: </strong>${currentFilter}</p>
                </div>`
        } catch (error) {
            console.error('Error loading Pokemon details for', pokemonRef.name, error)
            pokemonContainer.innerHTML += `
                <div onclick="detailFetch('${pokemonRef.url.split('/')[6]}')" class="pokemonCard">
                    <h3>${pokemonRef.name}</h3>
                    <p>Details unavailable</p>
                </div>`
        }
    }

    updatePaginationButtons()
}

async function loadMoves(page = 1) {
    currentMode = 'moves'
    currentFilter = 'Moves'
    currentPage = clampPage(page)

    try {
        const offset = (currentPage - 1) * pageSize
        const response = await fetch(`https://pokeapi.co/api/v2/move?limit=${pageSize}&offset=${offset}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch moves')
        const data = await response.json()

        totalPages = Math.ceil(data.count / pageSize)
        currentPage = clampPage(currentPage)
        currentList = data.results

        pokemonContainer.innerHTML = ''
        for (const move of currentList) {
            try {
                const id = move.url.split('/')[6]
                const detailResponse = await fetch(`https://pokeapi.co/api/v2/move/${id}`)
                if (!detailResponse.ok) throw new Error('Failed to fetch move details')
                const detail = await detailResponse.json()
                const type = detail.type.name
                const power = detail.power || 'N/A'
                const accuracy = detail.accuracy || 'N/A'
                pokemonContainer.innerHTML += `
                    <div onclick="detailMove('${id}')" class="pokemonCard">
                        <h3>${move.name}</h3>
                        <p><strong>Type: </strong>${type}</p>
                        <p><strong>Power: </strong>${power}</p>
                        <p><strong>Accuracy: </strong>${accuracy}</p>
                        <p><strong>Category: </strong>Moves</p>
                    </div>`
            } catch (error) {
                console.error('Error loading move details for', move.name, error)
                pokemonContainer.innerHTML += `
                    <div onclick="detailMove('${move.url.split('/')[6]}')" class="pokemonCard">
                        <h3>${move.name}</h3>
                        <p>Details unavailable</p>
                    </div>`
            }
        }
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }

    updatePaginationButtons()
}

async function loadItems(page = 1) {
    currentMode = 'items'
    currentFilter = 'Items'
    currentPage = clampPage(page)

    try {
        const offset = (currentPage - 1) * pageSize
        const response = await fetch(`https://pokeapi.co/api/v2/item?limit=${pageSize}&offset=${offset}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch items')
        const data = await response.json()

        totalPages = Math.ceil(data.count / pageSize)
        currentPage = clampPage(currentPage)
        currentList = data.results

        pokemonContainer.innerHTML = ''
        for (const item of currentList) {
            try {
                const id = item.url.split('/')[6]
                const detailResponse = await fetch(`https://pokeapi.co/api/v2/item/${id}`)
                if (!detailResponse.ok) throw new Error('Failed to fetch item details')
                const detail = await detailResponse.json()
                const effect = detail.effect_entries[0]?.short_effect || 'No effect'
                const category = detail.category.name
                const image = detail.sprites.default || ''
                pokemonContainer.innerHTML += `
                    <div onclick="detailItem('${id}')" class="pokemonCard">
                        ${image ? `<img src="${image}" class="imgCard" alt="${item.name}">` : ''}
                        <h3>${item.name}</h3>
                        <p><strong>Category: </strong>${category}</p>
                        <p><strong>Effect: </strong>${effect}</p>
                        <p><strong>Type: </strong>Items</p>
                    </div>`
            } catch (error) {
                console.error('Error loading item details for', item.name, error)
                pokemonContainer.innerHTML += `
                    <div onclick="detailItem('${item.url.split('/')[6]}')" class="pokemonCard">
                        <h3>${item.name}</h3>
                        <p>Details unavailable</p>
                    </div>`
            }
        }
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }

    updatePaginationButtons()
}

async function fetchRegion(region) {
    const gen = regionMap[region]
    if (!gen) return

    currentMode = 'region'
    currentFilter = region
    currentPage = 1

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/generation/${gen}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch region')
        const data = await response.json()
        currentList = data.pokemon_species
        totalPages = Math.ceil(currentList.length / pageSize)
        await loadListPage(1)
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }
}

async function fetchType(type) {
    currentMode = 'type'
    currentFilter = type
    currentPage = 1

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/type/${type}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch type')
        const data = await response.json()
        currentList = data.pokemon.map(item => item.pokemon)
        totalPages = Math.ceil(currentList.length / pageSize)
        await loadListPage(1)
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }
}

function changePage(delta) {
    const nextPage = clampPage(currentPage + delta)
    if (nextPage === currentPage) return
    if (currentMode === 'all') {
        loadAll(nextPage)
    } else if (currentMode === 'moves') {
        loadMoves(nextPage)
    } else if (currentMode === 'items') {
        loadItems(nextPage)
    } else {
        loadListPage(nextPage)
    }
}

function goToLastPage() {
    if (currentMode === 'all') {
        loadAll(totalPages)
    } else if (currentMode === 'moves') {
        loadMoves(totalPages)
    } else if (currentMode === 'items') {
        loadItems(totalPages)
    } else {
        loadListPage(totalPages)
    }
}

function openTeamManager() {
    renderTeamSlots()
    teamDetailsDiv.innerHTML = `<p>Haz clic en una pokebola para ver o eliminar tu Pokémon.</p>`
    teamModal.style.display = 'block'
    updatePaginationButtons()
}

function closeTeamManager() {
    teamModal.style.display = 'none'
    updatePaginationButtons()
}

function renderTeamSlots() {
    const pokeballUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png'
    teamSlotsDiv.innerHTML = team.map((slot, index) => {
        if (slot) {
            return `
                <div class="team-slot" onclick="selectTeamSlot(${index})">
                    <img src="${slot.sprite}" alt="${slot.name}">
                    <p>${slot.name}</p>
                    <span class="team-badge">Slot ${index + 1}</span>
                </div>`
        }
        return `
            <div class="team-slot" onclick="selectTeamSlot(${index})">
                <img src="${pokeballUrl}" alt="Pokeball">
                <p>Vacío</p>
                <span class="team-badge">Slot ${index + 1}</span>
            </div>`
    }).join('')
}

function selectTeamSlot(index) {
    const slot = team[index]
    if (!slot) {
        teamDetailsDiv.innerHTML = `
            <p>Este espacio está vacío.</p>
            <p>Ve a cualquier Pokémon y usa "Agregar al equipo" para rellenarlo.</p>`
        return
    }

    teamDetailsDiv.innerHTML = `
        <div class="columns">
            <img src="${slot.sprite}" alt="${slot.name}" style="width:120px;height:120px;object-fit:contain;margin:auto;">
            <h3>${slot.name}</h3>
            <p><strong>ID:</strong> ${slot.id}</p>
            <p><strong>Types:</strong> ${slot.types}</p>
            <p><strong>Abilities:</strong> ${slot.abilities}</p>
            <p><strong>Height:</strong> ${slot.height} m</p>
            <p><strong>Weight:</strong> ${slot.weight} kg</p>
        </div>
        <button class="team-action" onclick="removeFromTeam(${index})">Eliminar del equipo</button>`
}

function removeFromTeam(index) {
    team[index] = null
    renderTeamSlots()
    teamDetailsDiv.innerHTML = `<p>Pokémon eliminado del equipo.</p>`
}

function addCurrentPokemonToTeam() {
    if (!currentDetailPokemon) {
        alert('No hay Pokémon seleccionado para añadir al equipo.')
        return
    }

    if (team.some(slot => slot && slot.id === currentDetailPokemon.id)) {
        alert(`${currentDetailPokemon.name} ya está en el equipo.`)
        return
    }

    const slotIndex = team.findIndex(slot => slot === null)
    if (slotIndex === -1) {
        alert('El equipo ya está completo. Elimina un Pokémon antes de añadir otro.')
        return
    }

    team[slotIndex] = {
        id: currentDetailPokemon.id,
        name: currentDetailPokemon.name,
        sprite: currentDetailPokemon.sprites.front_default || currentDetailPokemon.sprites.other?.['official-artwork']?.front_default || '',
        types: currentDetailPokemon.types.map(t => t.type.name).join(', '),
        abilities: currentDetailPokemon.abilities.map(a => a.ability.name).join(', '),
        height: currentDetailPokemon.height / 10,
        weight: currentDetailPokemon.weight / 10
    }

    alert(`${currentDetailPokemon.name} se añadió al equipo.`)
    renderTeamSlots()
}

function renderTeamActionButton() {
    if (!currentDetailPokemon) return ''
    const alreadyInTeam = team.some(slot => slot && slot.id === currentDetailPokemon.id)
    if (alreadyInTeam) {
        return `<button class="team-action" onclick="openTeamManager()">Ver equipo</button>`
    }
    return `<button class="team-action" onclick="addCurrentPokemonToTeam()">Agregar al equipo</button>`
}

async function detailFetch(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
        if (!response.ok) throw new Error('Hay un error en el detailfetch')
        const pokemon = await response.json()

        const types = pokemon.types.map(t => t.type.name).join(', ')
        const abilities = pokemon.abilities.map(a => a.ability.name).join(', ')
        const stats = pokemon.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', ')
        currentDetailPokemon = pokemon
        modalDetail.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h2>${pokemon.name}</h2>
            <div class="columns">
                <p><strong>ID: </strong>${id}</p>
                <p><strong>Height: </strong>${pokemon.height / 10} m</p>
                <p><strong>Weight: </strong>${pokemon.weight / 10} kg</p>
                <p><strong>Types: </strong>${types}</p>
                <p><strong>Abilities: </strong>${abilities}</p>
                <p><strong>Base Stats: </strong>${stats}</p>
            </div>
            <div>
                <p><strong>Types:</strong></p>
                ${pokemon.types.map(type => `<button class="detailButton" onclick="fetchType('${type.type.name}')">${type.type.name}</button>`).join('')}
            </div>
            ${renderTeamActionButton()}`
        modal.style.display = 'block'
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }
}

async function detailNameFetch(name) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`)
        if (!response.ok) throw new Error('Hay un error en el detailfetch')
        const pokemon = await response.json()

        const types = pokemon.types.map(t => t.type.name).join(', ')
        const abilities = pokemon.abilities.map(a => a.ability.name).join(', ')
        const stats = pokemon.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(', ')
        currentDetailPokemon = pokemon
        modalDetail.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <h2>${pokemon.name}</h2>
            <div class="columns">
                <p><strong>ID: </strong>${name}</p>
                <p><strong>Height: </strong>${pokemon.height / 10} m</p>
                <p><strong>Weight: </strong>${pokemon.weight / 10} kg</p>
                <p><strong>Types: </strong>${types}</p>
                <p><strong>Abilities: </strong>${abilities}</p>
                <p><strong>Base Stats: </strong>${stats}</p>
            </div>
            <div>
                <p><strong>Types:</strong></p>
                ${pokemon.types.map(type => `<button class="detailButton" onclick="fetchType('${type.type.name}')">${type.type.name}</button>`).join('')}
            </div>
            ${renderTeamActionButton()}`
        modal.style.display = 'block'
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error')
    }
}

async function detailMove(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/move/${id}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch move')
        const move = await response.json()

        const type = move.type.name
        const power = move.power || 'N/A'
        const accuracy = move.accuracy || 'N/A'
        const pp = move.pp
        const effect = move.effect_entries[0]?.effect || 'No effect'
        const shortEffect = move.effect_entries[0]?.short_effect || 'No short effect'

        modalDetail.innerHTML = `
            <h2>${move.name}</h2>
            <div class="columns">
                <p><strong>ID: </strong>${id}</p>
                <p><strong>Type: </strong>${type}</p>
                <p><strong>Power: </strong>${power}</p>
                <p><strong>Accuracy: </strong>${accuracy}</p>
                <p><strong>PP: </strong>${pp}</p>
                <p><strong>Effect: </strong>${effect}</p>
                <p><strong>Short Effect: </strong>${shortEffect}</p>
            </div>`
        modal.style.display = 'block'
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error al cargar detalles del movimiento')
    }
}

async function detailItem(id) {
    try {
        const response = await fetch(`https://pokeapi.co/api/v2/item/${id}`)
        if (!response.ok) throw new Error('No se pudo hacer el fetch item')
        const item = await response.json()

        const category = item.category.name
        const effect = item.effect_entries[0]?.effect || 'No effect'
        const shortEffect = item.effect_entries[0]?.short_effect || 'No short effect'
        const image = item.sprites.default || ''

        modalDetail.innerHTML = `
            ${image ? `<img src="${image}" alt="${item.name}">` : ''}
            <h2>${item.name}</h2>
            <div class="columns">
                <p><strong>ID: </strong>${id}</p>
                <p><strong>Category: </strong>${category}</p>
                <p><strong>Effect: </strong>${effect}</p>
                <p><strong>Short Effect: </strong>${shortEffect}</p>
            </div>`
        modal.style.display = 'block'
    } catch (error) {
        console.error('Hubo un problema:', error)
        alert('Error al cargar detalles del item')
    }
}

function backBtn() {
    pokemonContainer.classList.remove('invisible')
    pokemonContainer.classList.add('pokemonDiv')
    document.getElementById('detailDiv').classList.remove('hideDetailDiv')
    document.getElementById('detailDiv').classList.add('invisible')
    document.getElementById('searchDiv').classList.add('searchDiv')
    document.getElementById('searchDiv').classList.remove('invisible')
    updatePaginationButtons()
}

closeModal.addEventListener('click', () => {
    modal.style.display = 'none'
})

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none'
    }
    if (event.target === teamModal) {
        closeTeamManager()
    }
})

prev5Btn.addEventListener('click', () => changePage(-5))
prevBtn.addEventListener('click', () => changePage(-1))
nextBtn.addEventListener('click', () => changePage(1))
next5Btn.addEventListener('click', () => changePage(5))
allPagesBtn.addEventListener('click', () => goToLastPage())

loadAll(1)

movesBtn.addEventListener('click', () => loadMoves(1))
itemsBtn.addEventListener('click', () => loadItems(1))
pokemonBtn.addEventListener('click', () => loadAll(1))
teamBtn.addEventListener('click', () => openTeamManager())
