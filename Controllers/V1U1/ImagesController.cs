using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Linq;
using System.Net;
using CloudStorage.Services;
using CloudStorage.Entities;
using CloudStorage.Models;
using Asp.Versioning;
using CloudStorage.Entities.V1U1;

namespace CloudStorage.Controllers.V1U1
{
    [ApiController]
    [Route("api/[controller]")]
    [ApiVersion("1.1")]
    public class ImagesController : Controller
    {
        private readonly IImageTableStorage imageTableStorage;

        public ImagesController(IImageTableStorage imageTableStorage)
        {
            this.imageTableStorage = imageTableStorage;
        }

        [HttpGet]
        public IAsyncEnumerable<ImageEntity> GetAsync()
        {
            return imageTableStorage.GetAllImagesAsync().Select(image => new ImageEntity(image));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetAsync(string id)
        {
            var imageModel = await this.imageTableStorage.GetAsync(id);

            if (imageModel == null)
            {
                return NotFound();
            }

            Response.Headers["Cache-Control"] = "public, max-age=25200";

            Response.Headers["Location"] = imageTableStorage.GetDownloadUrl(imageModel);

            return StatusCode((int)HttpStatusCode.TemporaryRedirect);
        }

        [HttpPost]
        public async Task<IActionResult> PostAsync([FromBody] ImageEntity imageEntity)
        {
            var imageModel = imageEntity.ToModel(); // Call ToModel on the instance
            imageModel.UserName = "ethanneils28";

            await imageTableStorage.AddOrUpdateAsync(imageModel);

            var newImageEntity = new ImageEntity(imageModel);

            newImageEntity.UploadUrl = imageTableStorage.GetUploadUrl(imageModel.Id);

            return Ok(newImageEntity);
        }

        [HttpPut("{id}/uploadComplete")]
        public async Task<IActionResult> UploadCompleteAsync(string id)
        {
            // Get the image model from the database by its id.
            var imageModel = await this.imageTableStorage.GetAsync(id);

            // if it is null (i.e. it doesn't exist), return a NotFound status code
            if (imageModel == null)
            {
                return NotFound();
            }

            //Set UploadComplete to true on the imageModel and then save it.
            imageModel.UploadComplete = true;

            await imageTableStorage.AddOrUpdateAsync(imageModel);
            var imageEntity = new ImageEntity(imageModel); // Change the image model to the image entity
            return Json(imageEntity);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAsync(string id)
        {
            await this.imageTableStorage.DeleteAsync(id);
            return StatusCode((int)HttpStatusCode.NoContent);
        }

        [HttpDelete]
        public async Task<IActionResult> PurgeAsync()
        {
            await this.imageTableStorage.PurgeAsync();
            return StatusCode((int)HttpStatusCode.NoContent);
        }
    }
}