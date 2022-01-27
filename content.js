const interval = setInterval(() => {
  const table = document.querySelector('table.resultTable')

  if (table) {
    clearInterval(interval)
    console.log('table found')

    handleTable(table)
  }
}, 1000)


const handleTable = (table) => {
  const rows = [...table.querySelectorAll('tbody tr')]
    .filter(row => row.childElementCount > 2)
  const people = rows.map(rowToPerson)

  const familyTree = document.createElement('div')
  familyTree.id = 'familyTree'
  const tableWrapper = document.querySelector('.resultContainer')
  tableWrapper.parentNode.insertBefore(familyTree, tableWrapper)

  const family = createFamily(people)
  drawChart(family)
}

const nextLevel = (level, next) => {
  if (level === '') return next
  else if (level[level.length - 1] === 'i') return level + 'nin ' + next
  else if (level[level.length - 1] === 'ı') return level + 'nın ' + next
  return console.error('error', level, next)
}

const processNode = (people, node, level) => {
  let person
  if (level === '') {
    person = people.find(p => p.relation === 'Kendisi')
  } else {
    person = people.find(p => p.relation === level)
  }
  if (person) {
    node.name = person.name
    node.person = person
    node.children = [{name: person.mother, person: {gender: 'K'}}, {name: person.father, person: {gender: 'E'}}]
    processNode(people, node.children[0], nextLevel(level, 'Annesi'))
    processNode(people, node.children[1], nextLevel(level, 'Babası'))
  }
}
const createFamily = (people) => {
  people.reverse()
  const family = { }
  processNode(people, family, '')

  return family
}

const rowToPerson = row => ({
  gender: row.children[1].innerText,
  relation: row.children[2].innerText,
  name: row.children[3].innerText,
  surname: row.children[4].innerText,
  father: row.children[5].innerText,
  mother: row.children[6].innerText,
  birth: row.children[7].innerText,
  address: row.children[8].innerText,
  id: row.children[9].innerText,
  marital: row.children[10].innerText,
  death: row.children[11].innerText,
})

const drawChart = (family) => {
  console.log(family)
  familyHierarchy = d3.hierarchy(family)
  familyChart = graph(familyHierarchy)
}
const red = '#f87171'
const blue = '#60a5fa'
const purple = '#818cf8'
const dx = 120
const dy = -64
const width = 900*2
const height = 600*2
const margin = 16
const halfmargin = margin / 2
const tree = d3.tree().nodeSize([dx, dy])
const genderColors = {E: blue, K: red}

function graph(root) {
  root = tree(root);

  const svg = d3.create("svg")
    .attr("viewBox", [0, 0, width, height])

  const div = document.querySelector('#familyTree')
  div.appendChild(svg.node())

  function zoomed({transform}) {
    outer.attr("transform", transform);
  }
  svg.node().addEventListener('wheel', event => event.preventDefault())
  const outer = svg.append('g')
  const g = outer.append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("transform", `translate(${width / 2},${height / 2})`)

  svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 16])
      .on("zoom", zoomed))

  const link = g.append("g")
    .attr("fill", "none")
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr("stroke", 'gray')
    .attr("stroke-opacity", 1)
    .attr("d", ({ target, source }) => [
      [source.x, source.y],
      [(target.parent.children[0].x + target.parent.children[1].x) / 2, source.y],
      [(target.parent.children[0].x + target.parent.children[1].x) / 2, target.y],
      [target.x, target.y],
    ]
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.join(',')}`)
      .join())

  const node = g.append("g")
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  node.append("text")
    .attr("fill", "black")
    .attr("dy", "0.31em")
    .attr("text-anchor", "middle")
    .text(d => `${d.data.name} ${d.data.person.surname ?? ''}`);

  node.selectAll("text")
    .each(function(d) { d.bbox = this.getBBox(); });

  node.insert('rect', 'text')
    .attr('fill', d => d.data.person.relation === 'Kendisi' ? purple : genderColors[d.data.person.gender])
    .attr('x', d => d.bbox.x - halfmargin)
    .attr('y', d => d.bbox.y - halfmargin)
    .attr('width', d => d.bbox.width + margin)
    .attr('height', d => d.bbox.height + margin)

  return svg.node();
}
