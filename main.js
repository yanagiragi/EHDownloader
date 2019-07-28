const request = require('request');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs-extra');
const sanitize = require('sanitize-filename')

const StoragePath = './Storage/'

if(require.main === module)
{
	fs.ensureDirSync(StoragePath)
	
	const urls = process.argv.splice(2)	
	if(urls.length === 0){
		console.log("Example: node main.js $url [$url...]")
	}

	urls.map(url => main(url.replace(/\?p=[0-9]*/, '')))
}

function getpic(url, filepath){
	request(url, (err, res, body) => {
		if(!err){
			const $ = cheerio.load(body)
			const src = $('#i3 img').attr('src')
			const filename = path.join(filepath, sanitize(src.split('/').pop()))
			
			// Only Download if not Exists
			if(!fs.existsSync(filename)){
				request.get( { uri : src, encoding : 'binary' }, (err, res, body) => {
					if(!err)
						fs.writeFileSync(filename, body, 'binary')
					else
						console.log(`Err with ${src}`)
				});
			}
		}
	});
}

function main(urlBase, index=0)
{
	const url = (index === 0) ? `${urlBase}` : `${urlBase}?p=${index}`
	request(url, (err, res, body) =>{
		if(!err){
			const $ = cheerio.load(body)			
			const pageCount = $('.ptt td a')
				.toArray()
				.filter(x => x.type && x.type === 'tag')
				.map(x => parseInt(x.children[0].data)) // equal to split of $('.ptt td a').text()
				.filter(Number.isInteger) // get rid of '<' and '>'
				.sort()
				.pop()

			if(index >= pageCount) {
				return
			}
			else {
				// use japanese name, else use english
				const jpTitle = $('#gd2 #gj').text()
				const engTitle = $('#gd2 #gn').text()
				const title = jpTitle
				
				const filepath = path.join(StoragePath, sanitize(title, { replacement: '_' }))
				fs.ensureDirSync(filepath)
				
				const pics = $('.gdtm')
				console.log(`Found ${pics.length} Pics On ${title}, pagecount = ${index+1}/${pageCount}`)

				for(let i = 0; i < pics.length; ++i){
					let e = $('a', pics[i])
					getpic(e.attr('href'), filepath)
				}
				
				main(urlBase, index + 1)	
			}
		}
	});
}