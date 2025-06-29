import { Inject, MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from '@nestjs/config';
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { FEDIFY_FEDERATION, FedifyModule, integrateFederation } from "./fedify";
import { DatabaseModule } from './database/database.module';
import { FederationModule } from './modules/federation/federation.module';
import { DataSource } from 'typeorm';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		DatabaseModule,
		FedifyModule.forRoot({
			// Federation options here
		}),
		FederationModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule implements NestModule {
	constructor(
		@Inject(FEDIFY_FEDERATION) private federation: any,
		private dataSource: DataSource,
	) {}

	configure(consumer: MiddlewareConsumer) {
		const fedifyMiddleware = integrateFederation(this.federation, async (req, res) => {
			// Create rich context with database access and request info
			return {
				request: req,
				response: res,
				dataSource: this.dataSource,
				url: new URL(req.url, `${req.protocol}://${req.get('host')}`),
			};
		});
		
		// Apply middleware to all routes
		consumer
			.apply(fedifyMiddleware)
			.forRoutes({ path: '*', method: RequestMethod.ALL });
	}
}
